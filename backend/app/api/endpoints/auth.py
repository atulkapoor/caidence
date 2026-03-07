"""
Authentication endpoints: register, login, current user.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_active_user, get_current_authenticated_user, get_db, require_super_admin
from app.models.models import User
from app.models.rbac import Role
from app.services.auth_service import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token_payload,
)
from app.core.config import settings

router = APIRouter()

# --- Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "brand_admin"  # Default role


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    requires_password_reset: bool = False
    access_expires_in_seconds: int


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    organization_id: Optional[int]
    parent_user_id: Optional[int] = None
    is_active: bool
    is_approved: bool
    must_reset_password: bool = False

    class Config:
        from_attributes = True


# --- Endpoints ---
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """
    Register a new user. Account requires Super Admin approval.
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Enforce brand_admin for self-registered users and sync role_id.
    role_name = "brand_admin"
    role_result = await db.execute(select(Role).where(Role.name == role_name))
    role_obj = role_result.scalar_one_or_none()
    if not role_obj:
        raise HTTPException(status_code=500, detail="Role 'brand_admin' not found. Seed roles first.")

    # Create new user (not approved by default)
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=role_name,
        role_id=role_obj.id,
        is_active=True,
        is_approved=False,  # Requires admin approval
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Login and receive JWT token.
    """
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Allow login before admin approval so users can complete onboarding.
    # Access to protected product routes is still enforced elsewhere.
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    access_token = create_access_token(
        data={
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "organization_id": user.organization_id,
        }
    )
    refresh_token = create_refresh_token(
        data={
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "organization_id": user.organization_id,
        }
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "requires_password_reset": bool(user.must_reset_password),
        "access_expires_in_seconds": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_authenticated_user)):
    """
    Get current authenticated user.
    """
    return current_user


@router.post("/set-password")
async def set_password(
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Set password for invited user. Requires super admin authorization.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(password)
    user.must_reset_password = True
    await db.commit()

    return {"message": "Password set successfully"}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_authenticated_user),
):
    """
    Change current user's password.
    Also clears first-login reset requirement.
    """
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=422, detail="New password must be at least 8 characters")
    if verify_password(payload.new_password, current_user.hashed_password):
        raise HTTPException(status_code=422, detail="New password must be different from temporary password")

    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.must_reset_password = False
    await db.commit()

    return {"message": "Password updated successfully"}


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh access token using refresh token.
    Rotates refresh token on each refresh.
    """
    token_payload = decode_token_payload(payload.refresh_token)
    if not token_payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if token_payload.get("token_type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = token_payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token payload")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user. Please contact your administrator.")

    new_access_token = create_access_token(
        data={
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "organization_id": user.organization_id,
        }
    )
    new_refresh_token = create_refresh_token(
        data={
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "organization_id": user.organization_id,
        }
    )
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "requires_password_reset": bool(user.must_reset_password),
        "access_expires_in_seconds": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }

@router.post("/recover-password")
async def recover_password(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate password recovery.
    """
    from app.services.email_service import send_password_reset_email

    # Check user exists
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        # Generate token (mocked unique token for now)
        import uuid
        token = str(uuid.uuid4())
        # TODO: Save token to DB with expiry

        await send_password_reset_email(email, token)

    # Always return success to prevent email enumeration
    return {"message": "If this email is registered, a recovery link has been sent."}
