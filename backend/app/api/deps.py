from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Callable

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
    In PRODUCTION: Requires valid token, no fallback.
    In DEVELOPMENT: Falls back to mock super_admin for easier testing.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Function to return mock user (development only)
    def get_mock_user():
        if settings.is_production:
            raise credentials_exception
        print("DEBUG: Using MOCK SUPER ADMIN user for Dev Mode")
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
        
        # Check if user actually exists in DB
        from sqlalchemy.orm import selectinload
        result = await db.execute(select(User).options(selectinload(User.custom_permissions)).where(User.id == token_data.user_id))
        user = result.scalar_one_or_none()
        if user is None:
            return get_mock_user()
            
        return user
    except Exception as e:
        print(f"Auth Error: {e}")
        return get_mock_user()

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure user is active and approved."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Account pending approval")
    return current_user

# --- RBAC Permission Checks ---

def require_role(*allowed_roles: str) -> Callable:
    """
    Dependency factory that checks if user has one of the allowed roles.
    Usage: Depends(require_role("admin", "super_admin"))
    """
    async def check_role(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return check_role

def require_permission(action: str, resource: str = None) -> Callable:
    """
    Dependency factory that checks if user has permission for an action.
    Usage: Depends(require_permission("campaign:write"))
    
    Permission format: "resource:action" (e.g., "campaign:read", "content:write")
    
    Default permissions by role:
    - super_admin: all permissions
    - admin: all permissions for their organization
    - manager: read/write for campaigns, content, analytics
    - editor: read/write for content only
    - viewer: read-only for all
    """
    async def check_permission(current_user: User = Depends(get_current_active_user)) -> User:
        # Super admin bypasses all checks
        if current_user.role == "super_admin":
            return current_user
        
        # Define role-based permissions (Defaults)
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
        
        # Apply Custom Overrides
        # Assuming User.custom_permissions is loaded (list of Permission objects)
        if hasattr(current_user, "custom_permissions") and current_user.custom_permissions:
            for perm in current_user.custom_permissions:
                # perm.resource (e.g., "campaign"), perm.action (e.g., "write")
                # Our keys are "resource:action" (e.g., "campaign:write")
                # Also implies read if write is granted? For now, explicit.
                
                perm_key_write = f"{perm.resource}:write"
                perm_key_read = f"{perm.resource}:read"
                
                if perm.action == "write":
                    effective_permissions.add(perm_key_write)
                    effective_permissions.add(perm_key_read) # Write implies read often
                elif perm.action == "read":
                    effective_permissions.add(perm_key_read)
                    effective_permissions.discard(perm_key_write)
                elif perm.action == "none":
                    effective_permissions.discard(perm_key_write)
                    effective_permissions.discard(perm_key_read)

        # Check permission
        permission_key = f"{resource}:{action}" if resource else action
        if permission_key not in effective_permissions:
            # Check for implied permissions (e.g. asking for read, but have write)
            if action == "read" and f"{resource}:write" in effective_permissions:
                return current_user

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied for {permission_key}"
            )
        
        return current_user
    return check_permission

# Convenience dependencies for common permission checks
require_admin = require_role("admin", "super_admin")
require_manager = require_role("manager", "admin", "super_admin")
require_campaign_write = require_permission("write", "campaign")
require_content_write = require_permission("write", "content")

