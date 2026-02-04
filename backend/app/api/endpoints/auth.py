"""
Authentication endpoints: register, login, current user.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_active_user, get_db
from app.models.models import User
from app.services.auth_service import verify_password, get_password_hash, create_access_token

router = APIRouter()

# --- Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "viewer"  # Default role


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    organization_id: Optional[int]
    is_active: bool
    is_approved: bool

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
    
    # Create new user (not approved by default)
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
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
    
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval. Please wait for admin to approve."
        )
    
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "organization_id": user.organization_id,
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current authenticated user.
    """
    return current_user


@router.post("/set-password")
async def set_password(
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Set password for invited user (no email verification for now).
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = get_password_hash(password)
    await db.commit()
    
    return {"message": "Password set successfully"}
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
