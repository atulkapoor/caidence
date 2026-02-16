"""
PermissionEngine - Central RBAC permission evaluation service.

Resolution order:
  1. Super Admin / Root bypass → ALLOW
  2. Explicit DENY override (is_allowed=False) → DENY
  3. Explicit ALLOW override (is_allowed=True) → ALLOW
  4. Role default (from Role.permissions_json) → ALLOW/DENY
  5. Default → DENY

Scope cascade:
  Global > Organization > Brand > Team
  A permission granted at a wider scope applies at narrower scopes.
"""
from typing import Optional, List, Set, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.models import User
from app.models.rbac import Role, Permission
from app.services.auth_service import ROLE_HIERARCHY, is_super_admin

# Profile type → allowed roles mapping
PROFILE_TYPE_ROLE_CONSTRAINTS: Dict[str, Set[str]] = {
    "agency": {"root", "super_admin", "agency_admin", "agency_member"},
    "brand": {"brand_admin", "brand_member"},
    "creator": {"creator"},
}


class PermissionEngine:
    """Evaluates permissions for a user against a resource:action pair."""

    def __init__(self, user: User, role_obj: Optional[Role] = None):
        self.user = user
        self.role_obj = role_obj
        self._role_permissions: Optional[Set[str]] = None

    @classmethod
    async def for_user(cls, user_id: int, db: AsyncSession) -> "PermissionEngine":
        """Load a user with all permission-related data in one query."""
        result = await db.execute(
            select(User)
            .options(
                selectinload(User.custom_permissions),
                selectinload(User.role_model),
            )
            .where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise ValueError(f"User {user_id} not found")
        return cls(user, role_obj=user.role_model)

    @classmethod
    def from_loaded_user(cls, user: User) -> "PermissionEngine":
        """Create engine from an already-loaded User (with relationships)."""
        role_obj = getattr(user, "role_model", None)
        return cls(user, role_obj=role_obj)

    # ------------------------------------------------------------------
    # Core permission check
    # ------------------------------------------------------------------

    def has_permission(
        self,
        resource: str,
        action: str,
        scope_type: Optional[str] = None,
        scope_id: Optional[int] = None,
    ) -> bool:
        """
        Check if the user has permission for resource:action at the given scope.

        Args:
            resource: e.g. "campaign", "content", "admin"
            action: e.g. "read", "write"
            scope_type: Optional scope filter ("global", "organization", "brand", "team")
            scope_id: Optional ID for the scope (org_id, brand_id, team_id)

        Returns:
            True if allowed, False if denied.
        """
        # 1. Super Admin / Root bypass
        if is_super_admin(self.user.role):
            return True

        # 2-3. Check explicit overrides (deny takes priority over allow)
        override_result = self._check_overrides(resource, action, scope_type, scope_id)
        if override_result is not None:
            return override_result

        # 4. Check role defaults
        return self._check_role_default(resource, action)

    def get_effective_permissions(self) -> Set[str]:
        """
        Get all effective permissions for the user as a set of 'resource:action' strings.
        Useful for sending to the frontend.
        """
        if is_super_admin(self.user.role):
            return {"*:*"}  # Wildcard — frontend interprets as "all"

        # Start with role defaults
        effective = set(self._get_role_permissions())

        # Apply overrides
        if hasattr(self.user, "custom_permissions") and self.user.custom_permissions:
            for perm in self.user.custom_permissions:
                perm_key = f"{perm.resource}:{perm.action}"
                if perm.is_allowed is False:
                    # Explicit deny — remove both read and write
                    effective.discard(f"{perm.resource}:read")
                    effective.discard(f"{perm.resource}:write")
                elif perm.action == "write":
                    effective.add(f"{perm.resource}:write")
                    effective.add(f"{perm.resource}:read")  # write implies read
                elif perm.action == "read":
                    effective.add(f"{perm.resource}:read")
                    effective.discard(f"{perm.resource}:write")
                elif perm.action == "none":
                    effective.discard(f"{perm.resource}:read")
                    effective.discard(f"{perm.resource}:write")

        return effective

    # ------------------------------------------------------------------
    # Role assignment validation
    # ------------------------------------------------------------------

    def can_assign_role(self, target_role_name: str, target_user: Optional[User] = None) -> bool:
        """Check if this user can assign the given role to a target user."""
        # Root can assign anything
        if self.user.role == "root":
            return True

        # Check hierarchy: cannot assign equal or higher
        assigner_level = ROLE_HIERARCHY.get(self.user.role, 0)
        target_level = ROLE_HIERARCHY.get(target_role_name, 0)
        if target_level >= assigner_level:
            return False

        # Cross-org check (non-super_admins can only assign within their org)
        if target_user and not is_super_admin(self.user.role):
            if self.user.organization_id and target_user.organization_id:
                if self.user.organization_id != target_user.organization_id:
                    return False

        return True

    @staticmethod
    def validate_profile_type_role(profile_type: Optional[str], role_name: str) -> bool:
        """Check if a role is valid for a given profile type."""
        if not profile_type:
            return True  # No profile type constraint
        allowed = PROFILE_TYPE_ROLE_CONSTRAINTS.get(profile_type, set())
        if not allowed:
            return True  # Unknown profile type, no constraint
        return role_name in allowed

    # ------------------------------------------------------------------
    # Scope-aware data filtering
    # ------------------------------------------------------------------

    def get_org_filter(self) -> Optional[int]:
        """Get organization_id filter. Returns None if user can see all orgs."""
        if is_super_admin(self.user.role):
            return None
        return self.user.organization_id

    def get_brand_filter(self) -> Optional[int]:
        """Get brand_id filter. Returns None if user can see all brands in their org."""
        if is_super_admin(self.user.role) or self.user.role in ("agency_admin", "agency_member"):
            return None
        # Brand-level users should only see their assigned brand
        # This requires a brand_id on user (future enhancement)
        return None

    def get_team_filter(self) -> Optional[int]:
        """Get team_id filter. Returns None if user can see all teams."""
        if is_super_admin(self.user.role) or self.user.role in ("agency_admin",):
            return None
        return self.user.team_id

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _check_overrides(
        self,
        resource: str,
        action: str,
        scope_type: Optional[str] = None,
        scope_id: Optional[int] = None,
    ) -> Optional[bool]:
        """
        Check user's custom permission overrides.
        Returns True (allowed), False (denied), or None (no override found).
        """
        if not hasattr(self.user, "custom_permissions") or not self.user.custom_permissions:
            return None

        # Build scope priority order: specific scope first, then broader
        matching_perms = [
            p for p in self.user.custom_permissions
            if p.resource == resource
        ]

        if not matching_perms:
            return None

        # Sort by scope specificity (most specific first)
        scope_priority = {"team": 0, "brand": 1, "organization": 2, "global": 3}

        # Filter by applicable scope
        applicable = []
        for p in matching_perms:
            p_scope = p.scope_type or "global"
            # Check scope match
            if scope_type and scope_id:
                if p_scope == scope_type and p.scope_id == scope_id:
                    applicable.append(p)
                elif p_scope == "global":
                    applicable.append(p)  # Global always applies
                elif scope_priority.get(p_scope, 99) > scope_priority.get(scope_type, 99):
                    applicable.append(p)  # Wider scope applies
            else:
                applicable.append(p)

        if not applicable:
            return None

        # Sort: most specific scope first
        applicable.sort(key=lambda p: scope_priority.get(p.scope_type or "global", 99))

        # Check for explicit deny first (deny takes priority at any scope)
        for p in applicable:
            if p.is_allowed is False:
                return False

        # Check for action match
        for p in applicable:
            if p.action == "none":
                return False
            if p.action == action:
                return True
            if p.action == "write" and action == "read":
                return True  # write implies read

        return None

    def _check_role_default(self, resource: str, action: str) -> bool:
        """Check if the user's role grants this permission by default."""
        perm_key = f"{resource}:{action}"
        role_perms = self._get_role_permissions()
        if perm_key in role_perms:
            return True
        # write implies read
        if action == "read" and f"{resource}:write" in role_perms:
            return True
        return False

    def _get_role_permissions(self) -> Set[str]:
        """Get the set of permission strings from the role definition."""
        if self._role_permissions is not None:
            return self._role_permissions

        self._role_permissions = set()

        # Try DB-stored role permissions first
        if self.role_obj and self.role_obj.permissions_json:
            perms_json = self.role_obj.permissions_json
            if isinstance(perms_json, dict):
                for res, actions in perms_json.items():
                    if isinstance(actions, list):
                        for act in actions:
                            self._role_permissions.add(f"{res}:{act}")
                    elif isinstance(actions, str):
                        self._role_permissions.add(f"{res}:{actions}")

        # If DB role has no permissions, fall back to hardcoded defaults
        if not self._role_permissions:
            self._role_permissions = set(self._get_fallback_permissions())

        return self._role_permissions

    def _get_fallback_permissions(self) -> Set[str]:
        """Hardcoded fallback until DB roles are seeded. Matches deps.py role_permissions_map."""
        fallback = {
            "root": {"campaign:read", "campaign:write", "content:read", "content:write",
                     "analytics:read", "discovery:read", "discovery:write", "crm:read", "crm:write",
                     "design_studio:read", "design_studio:write", "marcom:read", "marcom:write",
                     "workflow:read", "workflow:write", "creators:read", "creators:write",
                     "admin:read", "admin:write"},
            "agency_admin": {"campaign:read", "campaign:write", "content:read", "content:write",
                             "analytics:read", "discovery:read", "discovery:write", "crm:read", "crm:write",
                             "design_studio:read", "design_studio:write", "marcom:read", "marcom:write",
                             "workflow:read", "workflow:write", "creators:read", "creators:write"},
            "agency_member": {"campaign:read", "campaign:write", "content:read", "content:write",
                              "analytics:read", "discovery:read", "design_studio:read", "design_studio:write",
                              "workflow:read", "creators:read"},
            "brand_admin": {"campaign:read", "campaign:write", "content:read", "content:write",
                            "analytics:read", "discovery:read", "crm:read", "crm:write",
                            "design_studio:read", "design_studio:write", "creators:read", "creators:write"},
            "brand_member": {"campaign:read", "content:read", "content:write",
                             "analytics:read", "discovery:read", "design_studio:read", "creators:read"},
            "creator": {"content:read", "content:write", "design_studio:read"},
            "viewer": {"campaign:read", "content:read", "analytics:read", "discovery:read", "design_studio:read"},
        }
        return fallback.get(self.user.role, set())
