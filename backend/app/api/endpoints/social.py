from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import SocialAccount, User
from app.api.deps import get_current_active_user
from app.models.models import SocialAccount, User
import httpx
import os
from fastapi.responses import RedirectResponse

"""Social account connection API endpoints — OAuth2 flows for 6 platforms."""
from pydantic import BaseModel

from app.core.config import settings
from app.api.deps import get_current_authenticated_user
from app.models.models import User
from app.services.social_auth_service import SocialAuthService, VALID_PLATFORMS

router = APIRouter()


@router.post("/Create")
async def create_social_credential(data: dict, db: AsyncSession = Depends(get_db)):
    credential = SocialAccount(
        user_id=1,  # temporary user
        platform=data["platform"],
        client_id=data["client_id"],
        client_secret=data["client_secret"],
        account_id=data.get("account_id"),
        account_name=data.get("account_name"),
        account_email=data.get("account_email"),
    )

    db.add(credential)
    await db.commit()
    await db.refresh(credential)

    return credential


@router.get("/Read")
async def get_social_credentials(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SocialAccount))
    return result.scalars().all()


@router.put("/{credential_id}/Update")
async def update_social_credential(credential_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SocialAccount).where(SocialAccount.id == credential_id)
    )

    credential = result.scalar_one_or_none()

    if not credential:
        raise HTTPException(404, "Not found")

    credential.platform = data["platform"]
    credential.client_id = data["client_id"]
    credential.client_secret = data["client_secret"]

    await db.commit()

    return {"message": "Updated"}


@router.delete("/{credential_id}/Delete")
async def delete_social_credential(credential_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SocialAccount).where(SocialAccount.id == credential_id)
    )

    credential = result.scalar_one_or_none()

    if not credential:
        raise HTTPException(404, "Not found")

    await db.delete(credential)
    await db.commit()

    return {"message": "Deleted"}












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
