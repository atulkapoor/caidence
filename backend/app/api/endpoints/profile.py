"""Profile API endpoints for user settings."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_authenticated_user
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import UserResponse, ProfileUpdate

router = APIRouter()

@router.get("/", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_authenticated_user)):
    """Get the current user's profile."""
    return current_user


@router.put("/", response_model=UserResponse)
async def update_profile(
    profile: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_authenticated_user),
):
    """Update the current user's profile."""
    # Update only provided fields
    update_data = profile.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    return current_user
