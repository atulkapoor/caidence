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
    In development only: falls back to a mock super_admin when NO token is provided.
    Invalid/expired tokens always raise 401. Production never uses mock users.
    """
    import os
    disable_mock_user = os.getenv("DISABLE_MOCK_USER", "false").lower() == "true"

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Only allow mock user when: no token AND development mode AND not explicitly disabled
    if not token:
        if disable_mock_user or settings.is_production:
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

    # Token was provided - validate it strictly (no mock fallback)
    token_data = decode_access_token(token)
    if token_data is None:
        raise credentials_exception

    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).options(
            selectinload(User.custom_permissions),
            selectinload(User.role_model),
        ).where(User.id == token_data.user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Account pending approval")
    return current_user


async def get_current_authenticated_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Like get_current_active_user but skips is_approved check.
    Used for onboarding endpoints that must work before admin approval."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
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
        from app.services.permission_engine import PermissionEngine
        engine = PermissionEngine.from_loaded_user(current_user)

        res = resource or action.split(":")[0] if ":" in action else resource
        act = action.split(":")[1] if ":" in action and not resource else action

        if not engine.has_permission(res or "", act):
            permission_key = f"{res}:{act}" if res else act
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied for {permission_key}"
            )
        return current_user
    return check_permission

# Convenience dependencies
require_admin = require_role("root", "super_admin", "agency_admin")
require_manager = require_role("root", "super_admin", "agency_admin", "agency_member")


# ========== ORGANIZATION FILTERING HELPERS ==========

async def ensure_org_access(
    current_user: User,
    resource_id: int,
    db: AsyncSession,
    model_class,
    id_field_name: str = "id"
) -> bool:
    from app.services.auth_service import is_super_admin as _is_super_admin
    if _is_super_admin(current_user.role):
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
    from app.services.auth_service import is_super_admin as _is_super_admin
    return None if _is_super_admin(current_user.role) else current_user.organization_id


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

def require_workflow_read(current_user: User = Depends(require_permission("read", "workflow"))) -> User:
    return current_user

def require_workflow_write(current_user: User = Depends(require_permission("write", "workflow"))) -> User:
    return current_user

def require_creators_read(current_user: User = Depends(require_permission("read", "creators"))) -> User:
    return current_user

def require_creators_write(current_user: User = Depends(require_permission("write", "creators"))) -> User:
    return current_user

def require_super_admin(current_user: User = Depends(get_current_active_user)) -> User:
    from app.services.auth_service import is_super_admin as _is_super_admin
    if not _is_super_admin(current_user.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")
    return current_user

