"""Social account connection and publishing API endpoints."""

from __future__ import annotations

import base64
import json
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_authenticated_user
from app.core.config import settings
from app.core.database import get_db
from app.models.models import ContentGeneration, DesignAsset, User
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


class FacebookPageResponse(BaseModel):
    id: str
    name: str


class SelectFacebookPageRequest(BaseModel):
    page_id: str


class InstagramAccountResponse(BaseModel):
    instagram_business_id: str
    instagram_username: str | None = None
    instagram_name: str | None = None
    page_id: str | None = None
    page_name: str | None = None


class SelectInstagramAccountRequest(BaseModel):
    instagram_business_id: str


class PublishPostRequest(BaseModel):
    message: str
    image_url: Optional[str] = None
    content_id: Optional[int] = None


class PublishPostResponse(BaseModel):
    platform: str
    status: str
    post_id: Optional[str] = None
    target_name: str
    published: bool = True


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
    text: Optional[str] = None
    message: Optional[str] = None
    visibility: str = "PUBLIC"
    image_data_url: Optional[str] = None
    design_asset_id: Optional[int] = None
    content_id: Optional[int] = None


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

    try:
        url = SocialAuthService.get_authorization_url(platform, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
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


@router.post("/facebook/select-page")
async def select_facebook_page(
    payload: SelectFacebookPageRequest,
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Select the Facebook page used for future publishing."""
    connection = await SocialAuthService.get_connection("facebook", current_user.id, db)
    if not connection:
        raise HTTPException(status_code=400, detail="Facebook is not connected")

    raw_payload: dict = {}
    if connection.raw_profile_json:
        try:
            raw_payload = json.loads(connection.raw_profile_json)
        except Exception:
            raw_payload = {}

    pages = raw_payload.get("facebook_pages", [])
    if not isinstance(pages, list) or not pages:
        raise HTTPException(status_code=400, detail="No Facebook pages available for this account")

    selected_page = next((p for p in pages if str(p.get("id")) == payload.page_id), None)
    if not selected_page:
        raise HTTPException(status_code=404, detail="Facebook page not found")

    raw_payload["selected_page"] = selected_page
    connection.platform_user_id = str(selected_page.get("id") or "")
    connection.platform_username = str(selected_page.get("name") or "")
    connection.platform_display_name = str(selected_page.get("name") or "")
    connection.raw_profile_json = json.dumps(raw_payload)
    await db.commit()
    await db.refresh(connection)

    return {
        "platform": "facebook",
        "selected_page": FacebookPageResponse(
            id=str(selected_page.get("id") or ""),
            name=str(selected_page.get("name") or ""),
        ),
    }


@router.post("/instagram/select-account")
async def select_instagram_account(
    payload: SelectInstagramAccountRequest,
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Select the Instagram business/creator account used for publishing."""
    connection = await SocialAuthService.get_connection("instagram", current_user.id, db)
    if not connection:
        raise HTTPException(status_code=400, detail="Instagram is not connected")

    raw_payload: dict = {}
    if connection.raw_profile_json:
        try:
            raw_payload = json.loads(connection.raw_profile_json)
        except Exception:
            raw_payload = {}

    accounts = raw_payload.get("instagram_accounts", [])
    if not isinstance(accounts, list) or not accounts:
        raise HTTPException(status_code=400, detail="No Instagram business accounts available for this user")

    selected_account = next(
        (a for a in accounts if str(a.get("instagram_business_id")) == payload.instagram_business_id),
        None,
    )
    if not selected_account:
        raise HTTPException(status_code=404, detail="Instagram business account not found")

    raw_payload["selected_instagram_account"] = selected_account
    connection.platform_user_id = str(selected_account.get("instagram_business_id") or "")
    connection.platform_username = str(selected_account.get("instagram_username") or "")
    connection.platform_display_name = (
        str(selected_account.get("instagram_name") or "")
        or str(selected_account.get("instagram_username") or "")
        or "Instagram"
    )
    connection.raw_profile_json = json.dumps(raw_payload)
    await db.commit()
    await db.refresh(connection)

    return {
        "platform": "instagram",
        "selected_account": InstagramAccountResponse(
            instagram_business_id=str(selected_account.get("instagram_business_id") or ""),
            instagram_username=str(selected_account.get("instagram_username") or "") or None,
            instagram_name=str(selected_account.get("instagram_name") or "") or None,
            page_id=str(selected_account.get("page_id") or "") or None,
            page_name=str(selected_account.get("page_name") or "") or None,
        ),
    }


@router.get("/connections", response_model=list[SocialConnectionResponse])
async def list_connections(
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """List active social connections for the current user."""
    connections = await SocialAuthService.get_connections(current_user.id, db)
    return [
        SocialConnectionResponse(
            id=connection.id,
            platform=connection.platform,
            platform_username=connection.platform_username,
            platform_display_name=connection.platform_display_name,
            is_active=connection.is_active,
            connected_at=connection.connected_at.isoformat() if connection.connected_at else None,
            follower_count=connection.follower_count,
            profile_picture_url=connection.profile_picture_url,
        )
        for connection in connections
    ]


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

    publish_text = (payload.text or payload.message or "").strip()
    if not publish_text:
        raise HTTPException(status_code=400, detail="LinkedIn post text is required")

    try:
        data = await SocialAuthService.publish_linkedin_post(
            user_id=current_user.id,
            text=publish_text,
            db=db,
            visibility=payload.visibility,
            image_bytes=image_bytes,
        )
        normalized = _normalize_publish_response(
            platform="linkedin",
            data=data,
            fallback_target_name="LinkedIn",
        )
        if normalized.get("published"):
            await _mark_content_as_posted(
                content_id=payload.content_id,
                user_id=current_user.id,
                target_name=str(normalized.get("target_name") or ""),
                db=db,
            )
        return {**data, **normalized}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"LinkedIn publish unexpected error: {exc}")


@router.post("/publish/{platform}", response_model=PublishPostResponse)
async def publish_post(
    platform: str,
    payload: PublishPostRequest,
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Publish text post to supported social platforms."""
    platform = platform.lower()
    publish_response: dict | None = None

    if platform == "linkedin":
        try:
            image_bytes: Optional[bytes] = None
            if payload.image_url:
                image_bytes = await _resolve_linkedin_image_bytes(payload.image_url)
            data = await SocialAuthService.publish_linkedin_post(
                user_id=current_user.id,
                text=payload.message,
                db=db,
                image_bytes=image_bytes,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

        publish_response = _normalize_publish_response(
            platform="linkedin",
            data=data,
            fallback_target_name="LinkedIn",
        )

    elif platform == "facebook":
        try:
            data = await SocialAuthService.publish_facebook_post(
                user_id=current_user.id,
                message=payload.message,
                db=db,
                image_url=(payload.image_url or "").strip() or None,
            )
            publish_response = _normalize_publish_response(
                platform="facebook",
                data=data,
                fallback_target_name="Facebook",
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    elif platform == "instagram":
        try:
            data = await SocialAuthService.publish_instagram_post(
                user_id=current_user.id,
                caption=payload.message,
                image_url=(payload.image_url or "").strip(),
                db=db,
            )
            publish_response = _normalize_publish_response(
                platform="instagram",
                data=data,
                fallback_target_name="Instagram",
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
    else:
        raise HTTPException(status_code=400, detail=f"Publishing not supported for platform: {platform}")

    if publish_response and publish_response.get("published"):
        await _mark_content_as_posted(
            content_id=payload.content_id,
            user_id=current_user.id,
            target_name=str(publish_response.get("target_name") or ""),
            db=db,
        )

    return publish_response


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


async def _resolve_linkedin_image_bytes(image_url: str) -> bytes:
    value = (image_url or "").strip()
    if not value:
        raise ValueError("LinkedIn image payload is empty")

    if value.startswith("data:"):
        return _decode_base64_data(value)

    if value.startswith(("http://", "https://")):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(value, follow_redirects=True)
            if resp.status_code < 200 or resp.status_code >= 300:
                raise ValueError(f"LinkedIn image URL returned HTTP {resp.status_code}")
            return resp.content
        except Exception as exc:  # noqa: BLE001
            raise ValueError(f"Failed to fetch LinkedIn image URL: {exc}") from exc

    raise ValueError("LinkedIn image must be a data URL or public http/https URL")


def _normalize_publish_response(
    platform: str,
    data: dict,
    fallback_target_name: str,
) -> dict:
    status = str(data.get("status") or "published").strip() or "published"
    normalized_platform = str(data.get("platform") or platform).strip().lower() or platform
    target_name = str(data.get("target_name") or fallback_target_name).strip() or fallback_target_name
    published = bool(data.get("published"))
    if "published" not in data:
        published = status.lower() in {"published", "posted", "success", "ok"}

    return {
        "platform": normalized_platform,
        "status": status,
        "post_id": data.get("post_id"),
        "target_name": target_name,
        "published": published,
    }


async def _mark_content_as_posted(
    content_id: Optional[int],
    user_id: int,
    target_name: str,
    db: AsyncSession,
) -> None:
    if not content_id:
        return

    result = await db.execute(
        select(ContentGeneration).where(
            ContentGeneration.id == content_id,
            ContentGeneration.user_id == user_id,
        )
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content generation not found for post status update")
    if content.is_posted:
        raise HTTPException(
            status_code=409,
            detail="This content is already posted. Create a new draft to post again.",
        )

    content.is_posted = True
    content.posted_at = datetime.now(timezone.utc)
    content.posted_target_name = target_name or None
    await db.commit()
