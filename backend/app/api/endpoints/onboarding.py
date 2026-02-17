"""Onboarding progress API endpoints — step tracking for first-time user setup."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.models import User
from app.services.onboarding_service import OnboardingService

router = APIRouter()


class UpdateStepRequest(BaseModel):
    step_index: int
    step_data: dict = {}
    profile_type: Optional[str] = None  # Set at step 0


@router.get("/progress")
async def get_progress(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current onboarding progress for the authenticated user."""
    progress = await OnboardingService.get_or_create_progress(current_user.id, db)
    steps = OnboardingService.get_steps(progress.profile_type)
    import json
    return {
        "current_step": progress.current_step,
        "profile_type": progress.profile_type,
        "is_complete": progress.is_complete,
        "steps": steps,
        "completed_steps": json.loads(progress.completed_steps or "[]"),
    }


@router.put("/progress")
async def update_progress(
    payload: UpdateStepRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a specific onboarding step's data and advance progress."""
    try:
        result = await OnboardingService.update_step(
            current_user.id,
            payload.step_index,
            payload.step_data,
            payload.profile_type,
            db,
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/complete")
async def complete_onboarding(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark onboarding as complete. Validates all required steps are done."""
    try:
        result = await OnboardingService.mark_complete(current_user.id, db)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
