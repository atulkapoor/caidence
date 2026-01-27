"""Profile API endpoints for user settings."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import UserResponse, ProfileUpdate

router = APIRouter()

# For now, use a fixed user ID (in production, get from auth token)
CURRENT_USER_ID = 1


async def get_or_create_default_user(db: AsyncSession) -> User:
    """Get the current user or create a default one if none exists."""
    result = await db.execute(select(User).where(User.id == CURRENT_USER_ID))
    user = result.scalar_one_or_none()
    
    if not user:
        # Create a default user for development
        user = User(
            id=CURRENT_USER_ID,
            email="user@cadence.ai",
            full_name="Alex Rivera",
            company="C(AI)DENCE",
            location="San Francisco, CA",
            bio="Product Designer passionate about AI and user experience. Building the future of marketing workflows.",
            industry="Technology",
            role="admin",
            is_active=True,
            is_approved=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


@router.get("/", response_model=UserResponse)
async def get_profile(db: AsyncSession = Depends(get_db)):
    """Get the current user's profile."""
    user = await get_or_create_default_user(db)
    return user


@router.put("/", response_model=UserResponse)
async def update_profile(profile: ProfileUpdate, db: AsyncSession = Depends(get_db)):
    """Update the current user's profile."""
    user = await get_or_create_default_user(db)
    
    # Update only provided fields
    update_data = profile.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(user, field):
            setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    return user
