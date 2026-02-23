"""
OnboardingService — Profile-type-aware step tracking for user onboarding.

Supports three onboarding paths:
- Agency (6 steps): Profile Type → Company Info → Branding → Connect Socials → Invite Team → Create Brand
- Brand (5 steps): Profile Type → Brand Identity → Target Audience → Connect Socials → Brand Guidelines
- Creator (5 steps): Profile Type → Personal Info → Connect Socials (min 1 required) → Portfolio → Rate Card
"""
import json
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.models import User
from app.models.social import OnboardingProgress, SocialConnection


# Step definitions per profile type
ONBOARDING_STEPS = {
    "agency": [
        {"index": 0, "name": "profile_type", "title": "Profile Type", "required": True, "skippable": False},
        {"index": 1, "name": "company_info", "title": "Company Information", "required": True, "skippable": False},
        {"index": 2, "name": "branding", "title": "Branding", "required": False, "skippable": True},
        {"index": 3, "name": "connect_socials", "title": "Connect Social Accounts", "required": False, "skippable": True},
        {"index": 4, "name": "invite_team", "title": "Invite Team Members", "required": False, "skippable": True},
        {"index": 5, "name": "create_brand", "title": "Create Your First Brand", "required": False, "skippable": True},
    ],
    "brand": [
        {"index": 0, "name": "profile_type", "title": "Profile Type", "required": True, "skippable": False},
        {"index": 1, "name": "brand_identity", "title": "Brand Identity", "required": True, "skippable": False},
        {"index": 2, "name": "target_audience", "title": "Target Audience", "required": False, "skippable": True},
        {"index": 3, "name": "connect_socials", "title": "Connect Social Accounts", "required": False, "skippable": True},
        {"index": 4, "name": "brand_guidelines", "title": "Brand Guidelines", "required": False, "skippable": True},
    ],
    "creator": [
        {"index": 0, "name": "profile_type", "title": "Profile Type", "required": True, "skippable": False},
        {"index": 1, "name": "personal_info", "title": "Personal Information", "required": True, "skippable": False},
        {"index": 2, "name": "connect_socials", "title": "Connect Social Accounts", "required": True, "skippable": False},
        {"index": 3, "name": "portfolio", "title": "Portfolio", "required": False, "skippable": True},
        {"index": 4, "name": "rate_card", "title": "Rate Card", "required": False, "skippable": True},
    ],
    "default": [
        {"index": 0, "name": "profile_type", "title": "Choose Your Profile Type", "required": True, "skippable": False},
    ],
}


class OnboardingService:
    """Manages onboarding progress for users."""

    @staticmethod
    async def get_or_create_progress(user_id: int, db: AsyncSession) -> OnboardingProgress:
        """Fetch or create an OnboardingProgress record for a user."""
        result = await db.execute(
            select(OnboardingProgress).where(OnboardingProgress.user_id == user_id)
        )
        progress = result.scalar_one_or_none()

        if not progress:
            progress = OnboardingProgress(user_id=user_id)
            db.add(progress)
            await db.commit()
            await db.refresh(progress)

        return progress

    @staticmethod
    def get_steps(profile_type: Optional[str]) -> list[dict]:
        """Get the step definitions for a given profile type."""
        if profile_type and profile_type in ONBOARDING_STEPS:
            return ONBOARDING_STEPS[profile_type]
        return ONBOARDING_STEPS["default"]

    @staticmethod
    async def update_step(
        user_id: int,
        step_index: int,
        step_data: dict,
        profile_type: Optional[str],
        db: AsyncSession,
    ) -> dict:
        """Update a specific onboarding step's data and mark it completed."""
        progress = await OnboardingService.get_or_create_progress(user_id, db)

        # Handle profile type selection (step 0)
        if profile_type and step_index == 0:
            if profile_type not in ONBOARDING_STEPS:
                raise ValueError(f"Invalid profile type: {profile_type}")
            progress.profile_type = profile_type

        # Update step data
        current_data = json.loads(progress.step_data or "{}")
        current_data[f"step_{step_index}"] = step_data
        progress.step_data = json.dumps(current_data)

        # Creator-specific guard: social connection is required at connect_socials step.
        steps = OnboardingService.get_steps(progress.profile_type)
        step = next((s for s in steps if s["index"] == step_index), None)
        if (
            progress.profile_type == "creator"
            and step
            and step["name"] == "connect_socials"
        ):
            result = await db.execute(
                select(SocialConnection).where(
                    SocialConnection.user_id == user_id,
                    SocialConnection.is_active == True,  # noqa: E712
                )
            )
            connections = result.scalars().all()
            if not connections:
                raise ValueError("Creators must connect at least one social account")

        # Mark step as completed
        completed = json.loads(progress.completed_steps or "[]")
        if step_index not in completed:
            completed.append(step_index)
            completed.sort()
        progress.completed_steps = json.dumps(completed)

        # Advance current_step to the next uncompleted step
        next_step = step_index + 1
        if next_step < len(steps):
            progress.current_step = next_step
        else:
            progress.current_step = len(steps) - 1

        await db.commit()
        await db.refresh(progress)

        return {
            "current_step": progress.current_step,
            "profile_type": progress.profile_type,
            "is_complete": progress.is_complete,
            "steps": OnboardingService.get_steps(progress.profile_type),
            "completed_steps": json.loads(progress.completed_steps),
            "step_data": json.loads(progress.step_data or "{}"),
        }

    @staticmethod
    async def can_complete(user_id: int, db: AsyncSession) -> tuple[bool, str]:
        """Check if a user has completed all required onboarding steps."""
        progress = await OnboardingService.get_or_create_progress(user_id, db)

        if not progress.profile_type:
            return False, "Profile type not selected"

        steps = OnboardingService.get_steps(progress.profile_type)
        completed = json.loads(progress.completed_steps or "[]")

        # Check all required steps are completed
        for step in steps:
            if step["required"] and step["index"] not in completed:
                return False, f"Required step '{step['title']}' not completed"

        # Creator-specific: must have at least 1 active social connection
        if progress.profile_type == "creator":
            result = await db.execute(
                select(SocialConnection).where(
                    SocialConnection.user_id == user_id,
                    SocialConnection.is_active == True,  # noqa: E712
                )
            )
            connections = result.scalars().all()
            if not connections:
                return False, "Creators must connect at least one social account"

        return True, ""

    @staticmethod
    async def mark_complete(user_id: int, db: AsyncSession) -> dict:
        """Mark onboarding as complete and sync profile_type to User."""
        can_complete, reason = await OnboardingService.can_complete(user_id, db)
        if not can_complete:
            raise ValueError(f"Cannot complete onboarding: {reason}")

        progress = await OnboardingService.get_or_create_progress(user_id, db)
        progress.is_complete = True
        progress.completed_at = datetime.utcnow()

        # Sync profile_type to User model
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user and progress.profile_type:
            user.profile_type = progress.profile_type

        await db.commit()

        return {
            "is_complete": True,
            "profile_type": progress.profile_type,
            "completed_at": progress.completed_at.isoformat() if progress.completed_at else None,
        }
