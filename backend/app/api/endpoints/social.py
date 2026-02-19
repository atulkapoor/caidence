"""Social account connection API endpoints — OAuth2 flows for 6 platforms."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_authenticated_user
from app.models.models import User
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


@router.post("/connect/{platform}")
async def initiate_connection(
    platform: str,
    current_user: User = Depends(get_current_authenticated_user),
):
    """Generate OAuth authorization URL for a social platform."""
    if platform not in VALID_PLATFORMS:
        raise HTTPException(400, f"Unsupported platform: {platform}. Supported: {', '.join(VALID_PLATFORMS)}")
    url = SocialAuthService.get_authorization_url(platform, current_user.id)
    return {"authorization_url": url, "platform": platform}


@router.get("/callback/{platform}")
async def oauth_callback(
    platform: str,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """Handle OAuth callback — exchange code for token, store connection, redirect to frontend."""
    if platform not in VALID_PLATFORMS:
        raise HTTPException(400, f"Unsupported platform: {platform}")
    try:
        await SocialAuthService.handle_callback(platform, code, state, db)
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/onboarding?step=connect_socials&connected={platform}"
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/connections", response_model=list[SocialConnectionResponse])
async def list_connections(
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active social connections for the current user."""
    connections = await SocialAuthService.get_connections(current_user.id, db)
    return connections


@router.delete("/disconnect/{platform}")
async def disconnect_platform(
    platform: str,
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke and remove a social connection."""
    if platform not in VALID_PLATFORMS:
        raise HTTPException(400, f"Unsupported platform: {platform}")
    await SocialAuthService.disconnect(platform, current_user.id, db)
    return {"message": f"Disconnected from {platform}", "platform": platform}
