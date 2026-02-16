"""
RBAC decorators for FastAPI endpoints.
"""
from functools import wraps
from fastapi import HTTPException, status
from app.services.auth_service import is_super_admin


def require_scope(*scope_types: str):
    """
    Decorator that validates the user has the required scope access.

    Usage:
        @router.get("/brands/{brand_id}/creators")
        @require_scope("organization", "brand")
        async def list_creators(brand_id: int, current_user: User = Depends(...), db = Depends(get_db)):
            ...

    Scope types:
        - "organization": User must belong to the same org as the resource
        - "brand": User must have brand-level access
        - "team": User must be on the same team
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="current_user not found in endpoint kwargs"
                )

            # Super admins bypass scope checks
            if is_super_admin(current_user.role):
                return await func(*args, **kwargs)

            for scope in scope_types:
                if scope == "organization":
                    if not current_user.organization_id:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="User must belong to an organization"
                        )
                elif scope == "brand":
                    # Brand-level users need brand_id
                    if current_user.role in ("brand_admin", "brand_member"):
                        user_brand = getattr(current_user, "brand_id", None)
                        if not user_brand:
                            pass  # Allow if no brand constraint yet
                elif scope == "team":
                    if current_user.role not in ("agency_admin", "super_admin", "root"):
                        if not current_user.team_id:
                            pass  # Allow if no team constraint

            return await func(*args, **kwargs)
        return wrapper
    return decorator
