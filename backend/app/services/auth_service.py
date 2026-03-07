"""
Authentication service with JWT tokens and password hashing.
"""
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import settings

# --- Configuration ---
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


# --- JWT Token ---
class TokenData(BaseModel):
    user_id: int
    email: str
    role: str
    organization_id: Optional[int] = None
    token_type: str = "access"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "token_type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "token_type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token_payload(token: str) -> Optional[dict]:
    """Decode any JWT token payload."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def decode_access_token(token: str) -> Optional[TokenData]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        token_type = payload.get("token_type", "access")
        if token_type != "access":
            return None
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        role: str = payload.get("role")
        organization_id: int = payload.get("organization_id")
        if user_id is None or email is None:
            return None
        return TokenData(
            user_id=user_id,
            email=email,
            role=role,
            organization_id=organization_id,
            token_type=token_type,
        )
    except JWTError:
        return None


# --- Role Permissions ---
ROLE_HIERARCHY = {
    "root": 110,
    "super_admin": 100,
    "agency_admin": 80,
    "org_admin": 80,
    "agency_member": 60,
    "brand_admin": 50,
    "brand_member": 40,
    "creator": 20,
    "viewer": 10,
}


def has_permission(user_role: str, required_role: str) -> bool:
    """Check if a user role has at least the required permission level."""
    user_level = ROLE_HIERARCHY.get(user_role, 0)
    required_level = ROLE_HIERARCHY.get(required_role, 100)
    return user_level >= required_level


def is_super_admin(role: str) -> bool:
    """Check if user is super admin."""
    return role in ["root", "super_admin"]


def is_agency_level(role: str) -> bool:
    """Check if user has agency-level access."""
    return role in ["super_admin", "agency_admin", "org_admin", "agency_member"]


def is_brand_level(role: str) -> bool:
    """Check if user has brand-level access."""
    return role in [
        "super_admin",
        "agency_admin",
        "org_admin",
        "agency_member",
        "brand_admin",
        "brand_member",
    ]
