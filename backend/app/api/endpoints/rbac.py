from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_db
from app.models.rbac import Role, Permission, AuditLog
from app.models.models import User
from app.models.team import Team
from app.api.endpoints.auth import get_current_active_user
from app.services.auth_service import is_super_admin, ROLE_HIERARCHY
from app.services.permission_engine import PermissionEngine
from app.schemas import rbac_schemas as schemas

router = APIRouter()


# ========== HELPERS ==========

async def _log_audit(
    db: AsyncSession,
    actor: User,
    action: str,
    target_user: Optional[User] = None,
    details: dict = None,
):
    """Write an audit log entry."""
    entry = AuditLog(
        actor_id=actor.id,
        actor_email=actor.email,
        action=action,
        target_user_id=target_user.id if target_user else None,
        target_user_email=target_user.email if target_user else None,
        details=details or {},
    )
    db.add(entry)


def _require_admin(current_user: User):
    """Raise 403 if the user is not a super admin or root."""
    if not is_super_admin(current_user.role):
        raise HTTPException(status_code=403, detail="Super admin access required")


# ========== ROLE ENDPOINTS ==========

@router.get("/roles", response_model=List[schemas.Role])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all available roles, ordered by hierarchy level (highest first)."""
    result = await db.execute(select(Role).order_by(Role.hierarchy_level.desc()))
    return result.scalars().all()


@router.post("/roles", response_model=schemas.Role, status_code=201)
async def create_role(
    role_data: schemas.RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new custom role. Super admin only."""
    _require_admin(current_user)

    # Check for duplicate name
    existing = await db.execute(select(Role).where(Role.name == role_data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Role '{role_data.name}' already exists")

    # Cannot create a role at or above your own level
    if current_user.role != "root":
        assigner_level = ROLE_HIERARCHY.get(current_user.role, 0)
        if role_data.hierarchy_level >= assigner_level:
            raise HTTPException(
                status_code=403,
                detail="Cannot create a role at or above your hierarchy level"
            )

    role = Role(**role_data.model_dump())
    db.add(role)
    await _log_audit(db, current_user, "role_created", details={"role_name": role_data.name})
    await db.commit()
    await db.refresh(role)
    return role


@router.put("/roles/{role_id}", response_model=schemas.Role)
async def update_role(
    role_id: int,
    role_data: schemas.RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update an existing role. Super admin only."""
    _require_admin(current_user)

    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Prevent editing built-in roles' names (root, super_admin)
    if role.name in ("root", "super_admin") and current_user.role != "root":
        raise HTTPException(status_code=403, detail="Cannot modify built-in root/super_admin roles")

    update_data = role_data.model_dump(exclude_unset=True)
    old_values = {}
    for field, value in update_data.items():
        old_values[field] = getattr(role, field)
        setattr(role, field, value)

    await _log_audit(
        db, current_user, "role_updated",
        details={"role_id": role_id, "role_name": role.name, "changes": update_data, "old_values": old_values}
    )
    await db.commit()
    await db.refresh(role)
    return role


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a custom role. Cannot delete built-in roles or roles with assigned users."""
    _require_admin(current_user)

    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Protect built-in roles
    built_in = {"root", "super_admin", "agency_admin", "agency_member", "brand_admin", "brand_member", "creator", "viewer"}
    if role.name in built_in:
        raise HTTPException(status_code=403, detail=f"Cannot delete built-in role '{role.name}'")

    # Check if any users are assigned
    users_result = await db.execute(select(User).where(User.role == role.name).limit(1))
    if users_result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Cannot delete role that has assigned users. Reassign them first.")

    await _log_audit(db, current_user, "role_deleted", details={"role_name": role.name, "role_id": role_id})
    await db.delete(role)
    await db.commit()
    return {"message": f"Role '{role.name}' deleted"}


# ========== ROLE PERMISSIONS EDITOR ==========

@router.put("/roles/{role_id}/permissions", response_model=schemas.Role)
async def update_role_permissions(
    role_id: int,
    data: schemas.RolePermissionsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update the permissions_json for a role. Super admin only."""
    _require_admin(current_user)

    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Validate actions
    valid_actions = {"read", "write"}
    for resource, actions in data.permissions_json.items():
        invalid = set(actions) - valid_actions
        if invalid:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid actions {invalid} for resource '{resource}'. Valid: {valid_actions}"
            )

    old_perms = role.permissions_json
    role.permissions_json = data.permissions_json

    await _log_audit(
        db, current_user, "role_permissions_updated",
        details={"role_id": role_id, "role_name": role.name, "old_permissions": old_perms, "new_permissions": data.permissions_json}
    )
    await db.commit()
    await db.refresh(role)
    return role


# ========== ROLE ASSIGNMENT ==========

@router.post("/assign", response_model=dict)
async def assign_role(
    assignment: schemas.RoleAssignment,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Assign a role to a user.
    Root can assign anything.
    Non-root users can only assign roles below their own hierarchy level.
    """
    # 1. Fetch Target User
    result = await db.execute(select(User).where(User.id == assignment.user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Fetch Role
    result = await db.execute(select(Role).where(Role.name == assignment.role_name))
    role_obj = result.scalar_one_or_none()
    if not role_obj:
        raise HTTPException(status_code=404, detail="Role not found")

    # 3. Permission Checks
    if current_user.role != "root":
        if not is_super_admin(current_user.role):
            current_level = ROLE_HIERARCHY.get(current_user.role, 0)
            if current_level < ROLE_HIERARCHY.get("agency_admin", 80):
                raise HTTPException(status_code=403, detail="Insufficient permissions to assign roles")

        if not is_super_admin(current_user.role):
            if current_user.organization_id and target_user.organization_id:
                if current_user.organization_id != target_user.organization_id:
                    raise HTTPException(status_code=403, detail="Cannot manage users outside your organization")

        assigner_level = ROLE_HIERARCHY.get(current_user.role, 0)
        target_role_level = ROLE_HIERARCHY.get(role_obj.name, 0)
        if target_role_level >= assigner_level:
            raise HTTPException(
                status_code=403,
                detail=f"Cannot assign role '{role_obj.name}' — it is at or above your permission level"
            )

    # 4. Apply Assignment
    old_role = target_user.role
    target_user.role_id = role_obj.id
    target_user.role = role_obj.name

    if assignment.scope_type == "team" and assignment.scope_id:
        target_user.team_id = assignment.scope_id

    await _log_audit(
        db, current_user, "role_assigned",
        target_user=target_user,
        details={"old_role": old_role, "new_role": role_obj.name, "scope_type": assignment.scope_type, "scope_id": assignment.scope_id}
    )
    await db.commit()

    return {"message": f"Role {role_obj.name} assigned to user {target_user.email}"}


# ========== USER PERMISSION OVERRIDE CRUD ==========

@router.get("/permissions/me", response_model=schemas.EffectivePermissions)
async def get_my_permissions(
    current_user: User = Depends(get_current_active_user),
):
    """Get the current user's effective permissions."""
    engine = PermissionEngine.from_loaded_user(current_user)
    effective = engine.get_effective_permissions()
    return schemas.EffectivePermissions(
        user_id=current_user.id,
        role=current_user.role,
        organization_id=current_user.organization_id,
        team_id=current_user.team_id,
        permissions=sorted(effective),
        is_super_admin=is_super_admin(current_user.role),
    )


@router.get("/users/{user_id}/permissions", response_model=schemas.EffectivePermissions)
async def get_user_permissions(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get effective permissions for any user. Super admin only."""
    _require_admin(current_user)

    engine = await PermissionEngine.for_user(user_id, db)
    effective = engine.get_effective_permissions()
    user = engine.user
    return schemas.EffectivePermissions(
        user_id=user.id,
        role=user.role,
        organization_id=user.organization_id,
        team_id=user.team_id,
        permissions=sorted(effective),
        is_super_admin=is_super_admin(user.role),
    )


@router.get("/overrides/{user_id}", response_model=List[schemas.PermissionOverride])
async def list_user_overrides(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all permission overrides for a user. Admin or the user themselves."""
    if user_id != current_user.id and not is_super_admin(current_user.role):
        raise HTTPException(status_code=403, detail="Can only view your own overrides or be super admin")

    result = await db.execute(
        select(Permission).where(Permission.user_id == user_id).order_by(Permission.resource)
    )
    return result.scalars().all()


@router.post("/overrides", response_model=schemas.PermissionOverride, status_code=201)
async def create_override(
    data: schemas.PermissionOverrideCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a per-user permission override. Super admin only."""
    _require_admin(current_user)

    # Verify target user exists
    result = await db.execute(select(User).where(User.id == data.user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for duplicate override
    existing = await db.execute(
        select(Permission).where(
            Permission.user_id == data.user_id,
            Permission.resource == data.resource,
            Permission.scope_type == data.scope_type,
            Permission.scope_id == data.scope_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Override already exists for user {data.user_id} on {data.resource} at {data.scope_type} scope. Use PUT to update."
        )

    perm = Permission(
        user_id=data.user_id,
        resource=data.resource,
        action=data.action,
        scope_type=data.scope_type,
        scope_id=data.scope_id,
        is_allowed=data.is_allowed,
    )
    db.add(perm)

    action_desc = "permission_granted" if data.is_allowed else "permission_denied"
    await _log_audit(
        db, current_user, action_desc,
        target_user=target_user,
        details={"resource": data.resource, "action": data.action, "scope": data.scope_type, "is_allowed": data.is_allowed}
    )
    await db.commit()
    await db.refresh(perm)
    return perm


@router.put("/overrides/{override_id}", response_model=schemas.PermissionOverride)
async def update_override(
    override_id: int,
    data: schemas.PermissionOverrideUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update an existing permission override. Super admin only."""
    _require_admin(current_user)

    result = await db.execute(select(Permission).where(Permission.id == override_id))
    perm = result.scalar_one_or_none()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission override not found")

    update_data = data.model_dump(exclude_unset=True)
    old_values = {}
    for field, value in update_data.items():
        old_values[field] = getattr(perm, field)
        setattr(perm, field, value)

    # Get target user for audit
    target_result = await db.execute(select(User).where(User.id == perm.user_id))
    target_user = target_result.scalar_one_or_none()

    await _log_audit(
        db, current_user, "permission_updated",
        target_user=target_user,
        details={"override_id": override_id, "changes": update_data, "old_values": old_values}
    )
    await db.commit()
    await db.refresh(perm)
    return perm


@router.delete("/overrides/{override_id}")
async def delete_override(
    override_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a permission override. Super admin only."""
    _require_admin(current_user)

    result = await db.execute(select(Permission).where(Permission.id == override_id))
    perm = result.scalar_one_or_none()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission override not found")

    target_result = await db.execute(select(User).where(User.id == perm.user_id))
    target_user = target_result.scalar_one_or_none()

    await _log_audit(
        db, current_user, "permission_revoked",
        target_user=target_user,
        details={"resource": perm.resource, "action": perm.action, "scope": perm.scope_type}
    )
    await db.delete(perm)
    await db.commit()
    return {"message": "Permission override deleted"}


# ========== BULK PERMISSION UPDATE ==========

@router.post("/overrides/bulk", response_model=schemas.BulkPermissionResult)
async def bulk_update_permissions(
    data: schemas.BulkPermissionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Bulk create or update permission overrides. Super admin only."""
    _require_admin(current_user)

    created = 0
    updated = 0
    errors = []

    for item in data.permissions:
        # Verify user exists
        user_result = await db.execute(select(User).where(User.id == item.user_id))
        target_user = user_result.scalar_one_or_none()
        if not target_user:
            errors.append(f"User {item.user_id} not found")
            continue

        # Check for existing override
        existing_result = await db.execute(
            select(Permission).where(
                Permission.user_id == item.user_id,
                Permission.resource == item.resource,
                Permission.scope_type == "global",
            )
        )
        existing = existing_result.scalar_one_or_none()

        if existing:
            existing.action = item.action
            existing.is_allowed = item.is_allowed
            updated += 1
        else:
            db.add(Permission(
                user_id=item.user_id,
                resource=item.resource,
                action=item.action,
                is_allowed=item.is_allowed,
                scope_type="global",
            ))
            created += 1

    await _log_audit(
        db, current_user, "bulk_permission_update",
        details={"count": len(data.permissions), "created": created, "updated": updated}
    )
    await db.commit()

    return schemas.BulkPermissionResult(created=created, updated=updated, errors=errors)


# ========== PERMISSION CHECK ==========

@router.post("/check", response_model=schemas.PermissionCheckResponse)
async def check_permission(
    data: schemas.PermissionCheckRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Check if the current user has a specific permission. Used by frontend for real-time checks."""
    engine = PermissionEngine.from_loaded_user(current_user)
    allowed = engine.has_permission(data.resource, data.action, data.scope_type, data.scope_id)

    if allowed:
        if is_super_admin(current_user.role):
            reason = "Super admin bypass"
        else:
            reason = f"Granted via role '{current_user.role}' or explicit override"
    else:
        reason = f"Not granted for role '{current_user.role}' and no override found"

    return schemas.PermissionCheckResponse(
        allowed=allowed,
        resource=data.resource,
        action=data.action,
        reason=reason,
    )


# ========== AUDIT LOG ==========

@router.get("/audit-log", response_model=List[schemas.AuditLogEntry])
async def get_audit_log(
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    action_filter: Optional[str] = Query(default=None, description="Filter by action type"),
    target_user_id: Optional[int] = Query(default=None, description="Filter by target user"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List RBAC audit log entries. Super admin only."""
    _require_admin(current_user)

    query = select(AuditLog).order_by(AuditLog.created_at.desc())

    if action_filter:
        query = query.where(AuditLog.action == action_filter)
    if target_user_id:
        query = query.where(AuditLog.target_user_id == target_user_id)

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
