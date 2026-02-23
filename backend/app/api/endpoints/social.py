"""Social account connection and publishing API endpoints."""

from __future__ import annotations

import base64
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_authenticated_user
from app.core.config import settings
from app.core.database import get_db
from app.models.models import DesignAsset, User
from app.models.social import SocialConnection
from app.services.auth_service import is_super_admin
from app.services.social_auth_service import SocialAuthService, VALID_PLATFORMS

router = APIRouter()


class SocialConnectionResponse(BaseModel):
    id: int
    platform: str
    platform_username: str | None = None
    platform_display_name: str | None = None
    is_active: bool
    connected_at: str | None = None
    follower_count: int | None = None
    profile_picture_url: str | None = None

    class Config:
        from_attributes = True


class AdminSocialConnectionResponse(BaseModel):
    id: int
    user_id: int
    user_email: str | None = None
    platform: str
    platform_username: str | None = None
    platform_display_name: str | None = None
    is_active: bool
    connected_at: str | None = None
    token_expires_at: str | None = None


class LinkedInPublishRequest(BaseModel):
    text: str = Field(..., min_length=1)
    visibility: str = "PUBLIC"
    image_data_url: Optional[str] = None
    design_asset_id: Optional[int] = None


@router.post("/connect/{platform}")
async def initiate_connection(
    platform: str,
    current_user: User = Depends(get_current_authenticated_user),
):
    """Generate OAuth authorization URL for a social platform."""
    if platform not in VALID_PLATFORMS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported platform: {platform}. Supported: {', '.join(VALID_PLATFORMS)}",
        )

    url = SocialAuthService.get_authorization_url(platform, current_user.id)
    return {"authorization_url": url, "platform": platform}


@router.get("/callback/{platform}")
async def oauth_callback(
    platform: str,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Handle OAuth callback and redirect back to onboarding."""
    if platform not in VALID_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

    if error:
        desc = (error_description or error).replace('"', "")
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/onboarding?step=connect_socials&error={platform}:{desc}"
        )

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing OAuth callback code/state")

    try:
        await SocialAuthService.handle_callback(platform, code, state, db)
        return RedirectResponse(f"{settings.FRONTEND_URL}/onboarding?step=connect_socials&connected={platform}")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/connections", response_model=list[SocialConnectionResponse])
async def list_connections(
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active social connections for the current user."""
    connections = await SocialAuthService.get_connections(current_user.id, db)
    return connections


@router.get("/connections/admin", response_model=list[AdminSocialConnectionResponse])
async def list_connections_for_settings(
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Settings view:
    - super admin: all users
    - agency/root admin: same organization
    - others: only own records
    """
    query = select(SocialConnection, User.email).join(User, SocialConnection.user_id == User.id)

    if is_super_admin(current_user.role):
        pass
    elif current_user.role in {"agency_admin", "root"} and current_user.organization_id:
        query = query.where(User.organization_id == current_user.organization_id)
    else:
        query = query.where(SocialConnection.user_id == current_user.id)

    query = query.order_by(SocialConnection.connected_at.desc())
    result = await db.execute(query)
    rows = result.all()

    return [
        AdminSocialConnectionResponse(
            id=connection.id,
            user_id=connection.user_id,
            user_email=user_email,
            platform=connection.platform,
            platform_username=connection.platform_username,
            platform_display_name=connection.platform_display_name,
            is_active=connection.is_active,
            connected_at=connection.connected_at.isoformat() if connection.connected_at else None,
            token_expires_at=connection.token_expires_at.isoformat() if connection.token_expires_at else None,
        )
        for connection, user_email in rows
    ]


@router.delete("/disconnect/{platform}")
async def disconnect_platform(
    platform: str,
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a social connection."""
    if platform not in VALID_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

    await SocialAuthService.disconnect(platform, current_user.id, db)
    return {"message": f"Disconnected from {platform}", "platform": platform}


@router.post("/publish/linkedin")
async def publish_linkedin(
    payload: LinkedInPublishRequest,
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Publish generated content/design to LinkedIn.

    - text only: pass `text`
    - text + generated image (not saved): pass `image_data_url`
    - text + saved design: pass `design_asset_id`
    """
    image_bytes: Optional[bytes] = None

    if payload.design_asset_id:
        result = await db.execute(
            select(DesignAsset).where(
                DesignAsset.id == payload.design_asset_id,
                DesignAsset.user_id == current_user.id,
            )
        )
        asset = result.scalar_one_or_none()
        if not asset:
            raise HTTPException(status_code=404, detail="Design asset not found")

        if not asset.image_url:
            raise HTTPException(status_code=400, detail="Design asset has no image data")

        try:
            image_bytes = _decode_base64_data(asset.image_url)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"Invalid stored image data: {exc}")

    elif payload.image_data_url:
        try:
            image_bytes = _decode_base64_data(payload.image_data_url)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"Invalid image data: {exc}")

    try:
        data = await SocialAuthService.publish_linkedin_post(
            user_id=current_user.id,
            text=payload.text,
            db=db,
            visibility=payload.visibility,
            image_bytes=image_bytes,
        )
        return data
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"LinkedIn publish unexpected error: {exc}")


@router.get("/status/{platform}")
async def connection_status(
    platform: str,
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Quick status endpoint for UI checks before publish."""
    if platform not in VALID_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

    result = await db.execute(
        select(SocialConnection).where(
            SocialConnection.user_id == current_user.id,
            SocialConnection.platform == platform,
            SocialConnection.is_active == True,  # noqa: E712
        )
    )
    connection = result.scalar_one_or_none()
    return {
        "platform": platform,
        "connected": bool(connection and connection.access_token),
        "platform_username": connection.platform_username if connection else None,
    }


def _decode_base64_data(value: str) -> bytes:
    """
    Decode either raw base64 string or data URL:
    - data:image/png;base64,....
    - iVBORw0KGgoAAA...
    """
    encoded = value
    if "," in value and "base64" in value[:80]:
        encoded = value.split(",", 1)[1]

    try:
        return base64.b64decode(encoded, validate=True)
    except Exception as exc:  # noqa: BLE001
        raise ValueError("Expected base64-encoded image") from exc
