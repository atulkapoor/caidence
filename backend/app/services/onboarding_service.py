"""
OnboardingService — Profile-type-aware step tracking for user onboarding.

Supports three onboarding paths:
- Agency (6 steps): Profile Type → Company Info → Branding → Connect Socials → Invite Team → Create Brand
- Brand (5 steps): Profile Type → Brand Identity → Target Audience → Connect Socials → Brand Guidelines
- Creator (5 steps): Profile Type → Personal Info → Connect Socials (min 1 required) → Portfolio → Rate Card
"""
import base64
import binascii
import json
import re
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse

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
    HEX_COLOR_REGEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
    LOGO_DATA_URL_REGEX = re.compile(r"^data:(image/(?:png|jpeg|svg\+xml));base64,(.+)$", re.IGNORECASE)
    MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024

    ROLE_ALLOWED_PROFILE_TYPES = {
        "root": {"agency", "brand", "creator"},
        "super_admin": {"agency", "brand", "creator"},
        "agency_admin": {"agency", "brand", "creator"},
        "org_admin": {"agency", "brand", "creator"},
        "brand_admin": {"brand", "creator"},
        "creator": {"creator"},
    }

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
    def get_allowed_profile_types_for_role(role: Optional[str]) -> list[str]:
        """Allowed onboarding profile types by RBAC role."""
        if not role:
            return ["creator"]
        allowed = OnboardingService.ROLE_ALLOWED_PROFILE_TYPES.get(role, {"creator"})
        ordered = [ptype for ptype in ("agency", "brand", "creator") if ptype in allowed]
        return ordered or ["creator"]

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
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        allowed_profile_types = OnboardingService.get_allowed_profile_types_for_role(
            getattr(user, "role", None)
        )

        # Handle profile type selection (step 0)
        if profile_type and step_index == 0:
            if profile_type not in ONBOARDING_STEPS:
                raise ValueError(f"Invalid profile type: {profile_type}")
            if profile_type not in allowed_profile_types:
                raise ValueError(
                    f"Role '{getattr(user, 'role', 'unknown')}' cannot select profile type '{profile_type}'"
                )
            progress.profile_type = profile_type

        # Creator-specific guard: social connection is required at connect_socials step.
        steps = OnboardingService.get_steps(progress.profile_type)
        step = next((s for s in steps if s["index"] == step_index), None)

        validated_step_data = dict(step_data)
        if step and step["name"] == "company_info":
            validated_step_data = OnboardingService._validate_company_info(validated_step_data)
        elif step and step["name"] == "branding":
            validated_step_data = OnboardingService._validate_branding(validated_step_data)
        elif step and step["name"] == "create_brand":
            validated_step_data = OnboardingService._validate_create_brand(validated_step_data)
        elif step and step["name"] == "brand_identity":
            validated_step_data = OnboardingService._validate_brand_identity(validated_step_data)
        elif step and step["name"] == "portfolio":
            validated_step_data = OnboardingService._validate_portfolio(validated_step_data)

        # Update step data
        current_data = json.loads(progress.step_data or "{}")
        current_data[f"step_{step_index}"] = validated_step_data
        progress.step_data = json.dumps(current_data)

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

    @staticmethod
    def _validate_company_info(step_data: dict) -> dict:
        website_url = str(step_data.get("website_url", "")).strip()
        phone = str(step_data.get("phone", "")).strip()

        if website_url:
            parsed = urlparse(website_url)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError("Website URL must be a valid http/https URL")
            step_data["website_url"] = website_url

        if phone and not phone.isdigit():
            raise ValueError("Phone must contain digits only")

        step_data["phone"] = phone
        return step_data

    @staticmethod
    def _validate_create_brand(step_data: dict) -> dict:
        brand_url = str(step_data.get("brand_url", "")).strip()
        if brand_url:
            parsed = urlparse(brand_url)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError("Brand URL must be a valid http/https URL")
            step_data["brand_url"] = brand_url
        return step_data

    @staticmethod
    def _validate_brand_identity(step_data: dict) -> dict:
        primary_color = str(step_data.get("primary_color", "")).strip()
        logo_url = str(step_data.get("logo_url", "")).strip()

        if primary_color:
            normalized = primary_color if primary_color.startswith("#") else f"#{primary_color}"
            if not OnboardingService.HEX_COLOR_REGEX.match(normalized):
                raise ValueError("Primary color must be a valid 6-digit hex color")
            step_data["primary_color"] = normalized.upper()

        if logo_url:
            parsed = urlparse(logo_url)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError("Logo URL must be a valid http/https URL")
            step_data["logo_url"] = logo_url

        return step_data

    @staticmethod
    def _validate_portfolio(step_data: dict) -> dict:
        media_kit_url = str(step_data.get("media_kit_url", "")).strip()
        portfolio_url = str(step_data.get("portfolio_url", "")).strip()

        if media_kit_url:
            parsed = urlparse(media_kit_url)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError("Media Kit URL must be a valid http/https URL")
            step_data["media_kit_url"] = media_kit_url

        if portfolio_url:
            parsed = urlparse(portfolio_url)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError("Portfolio URL must be a valid http/https URL")
            step_data["portfolio_url"] = portfolio_url

        return step_data

    @staticmethod
    def _validate_branding(step_data: dict) -> dict:
        for field_name in ("primary_color", "secondary_color"):
            color_value = str(step_data.get(field_name, "")).strip()
            if color_value:
                normalized = color_value if color_value.startswith("#") else f"#{color_value}"
                if not OnboardingService.HEX_COLOR_REGEX.match(normalized):
                    raise ValueError(f"{field_name} must be a valid 6-digit hex color")
                step_data[field_name] = normalized.upper()

        logo_data_url = step_data.get("logo_data_url")
        if logo_data_url:
            if not isinstance(logo_data_url, str):
                raise ValueError("logo_data_url must be a valid image data URL")

            match = OnboardingService.LOGO_DATA_URL_REGEX.match(logo_data_url)
            if not match:
                raise ValueError("Logo must be PNG, JPG, or SVG image")

            encoded_payload = match.group(2)
            try:
                decoded_payload = base64.b64decode(encoded_payload, validate=True)
            except (binascii.Error, ValueError):
                raise ValueError("Logo image data is invalid") from None

            if len(decoded_payload) > OnboardingService.MAX_LOGO_SIZE_BYTES:
                raise ValueError("Logo file must be 5MB or smaller")

        return step_data
