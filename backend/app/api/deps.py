from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.models import User
from app.services.auth_service import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Extract and validate user from JWT token.
    DEV MODE: Returns mock super_admin if no token / valid token found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Function to return mock user
    def get_mock_user():
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
            return get_mock_user() # Fallback instead of raising
        
        # Check if user actually exists in DB
        result = await db.execute(select(User).where(User.id == token_data.user_id))
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
