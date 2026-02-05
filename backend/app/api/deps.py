from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Callable, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.config import settings
from app.models.models import User
from app.services.auth_service import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Extract and validate user from JWT token.
    Development falls back to a mock super_admin for convenience.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    def get_mock_user():
        if settings.is_production:
            raise credentials_exception
        return User(
            id=1,
            email="admin@demo.com",
            full_name="Demo Super Admin",
            role="super_admin",
            is_active=True,
            is_approved=True,
            organization_id=1,
            hashed_password="mock"
        )

    if not token:
        return get_mock_user()

    try:
        token_data = decode_access_token(token)
        if token_data is None:
            return get_mock_user()

        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(User).options(selectinload(User.custom_permissions)).where(User.id == token_data.user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            return get_mock_user()
        return user
    except Exception:
        return get_mock_user()

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Account pending approval")
    return current_user

# --- RBAC Permission Checks ---

def require_role(*allowed_roles: str) -> Callable:
    async def check_role(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return check_role

def require_permission(action: str, resource: Optional[str] = None) -> Callable:
    async def check_permission(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role == "super_admin":
            return current_user

        role_permissions_map = {
            "admin": {"campaign:read", "campaign:write", "content:read", "content:write",
                      "analytics:read", "discovery:read", "discovery:write", "crm:read", "crm:write",
                      "design_studio:read", "design_studio:write", "marcom:read", "marcom:write"},
            "manager": {"campaign:read", "campaign:write", "content:read", "content:write",
                        "analytics:read", "discovery:read", "design_studio:read", "design_studio:write"},
            "editor": {"content:read", "content:write", "discovery:read", "design_studio:read"},
            "viewer": {"campaign:read", "content:read", "analytics:read", "discovery:read", "design_studio:read"}
        }

        effective_permissions = set(role_permissions_map.get(current_user.role, set()))

        if hasattr(current_user, "custom_permissions") and current_user.custom_permissions:
            for perm in current_user.custom_permissions:
                perm_key_write = f"{perm.resource}:write"
                perm_key_read = f"{perm.resource}:read"
                if perm.action == "write":
                    effective_permissions.add(perm_key_write)
                    effective_permissions.add(perm_key_read)
                elif perm.action == "read":
                    effective_permissions.add(perm_key_read)
                    effective_permissions.discard(perm_key_write)
                elif perm.action == "none":
                    effective_permissions.discard(perm_key_write)
                    effective_permissions.discard(perm_key_read)

        permission_key = f"{resource}:{action}" if resource else action
        if permission_key not in effective_permissions:
            if action == "read" and resource and f"{resource}:write" in effective_permissions:
                return current_user
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Permission denied for {permission_key}")

        return current_user
    return check_permission

# Convenience dependencies
require_admin = require_role("admin", "super_admin")
require_manager = require_role("manager", "admin", "super_admin")


# ========== ORGANIZATION FILTERING HELPERS ==========

async def ensure_org_access(
    current_user: User,
    resource_id: int,
    db: AsyncSession,
    model_class,
    id_field_name: str = "id"
) -> bool:
    if current_user.role == "super_admin":
        return True
    result = await db.execute(
        select(model_class).where(getattr(model_class, id_field_name) == resource_id)
    )
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if hasattr(resource, "organization_id"):
        if resource.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif hasattr(resource, "owner_id"):
        owner_res = await db.execute(select(User).where(User.id == resource.owner_id))
        owner_user = owner_res.scalar_one_or_none()
        if owner_user and owner_user.organization_id != current_user.organization_id:
            raise HTTPException(status_code=403, detail="Access denied")
    return True

def get_org_filter(current_user: User):
    return None if current_user.role == "super_admin" else current_user.organization_id


# ========== PERMISSION CONVENIENCE DEPENDENCIES ==========

def require_org_member(current_user: User = Depends(get_current_active_user)) -> User:
    if not current_user.organization_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User must belong to an organization")
    return current_user

def require_campaign_read(current_user: User = Depends(require_permission("read", "campaign"))) -> User:
    return current_user

def require_campaign_write(current_user: User = Depends(require_permission("write", "campaign"))) -> User:
    return current_user

def require_content_read(current_user: User = Depends(require_permission("read", "content"))) -> User:
    return current_user

def require_content_write(current_user: User = Depends(require_permission("write", "content"))) -> User:
    return current_user

def require_design_read(current_user: User = Depends(require_permission("read", "design_studio"))) -> User:
    return current_user

def require_design_write(current_user: User = Depends(require_permission("write", "design_studio"))) -> User:
    return current_user

def require_discovery_read(current_user: User = Depends(require_permission("read", "discovery"))) -> User:
    return current_user

def require_analytics_read(current_user: User = Depends(require_permission("read", "analytics"))) -> User:
    return current_user

def require_crm_read(current_user: User = Depends(require_permission("read", "crm"))) -> User:
    return current_user

def require_crm_write(current_user: User = Depends(require_permission("write", "crm"))) -> User:
    return current_user

def require_marcom_read(current_user: User = Depends(require_permission("read", "marcom"))) -> User:
    return current_user

def require_marcom_write(current_user: User = Depends(require_permission("write", "marcom"))) -> User:
    return current_user

def require_super_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")
    return current_user

