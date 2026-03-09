"""Social account connection and publishing API endpoints."""

from __future__ import annotations

import base64
import json
from datetime import datetime, timezone
from typing import Optional, Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_authenticated_user
from app.core.config import settings
from app.core.database import get_db
from app.models.models import Campaign, ContentGeneration, DesignAsset, ScheduledPost, User
from app.models.social import SocialConnection
from app.services.auth_service import is_super_admin
from app.services.rbac_scope import visible_user_filter
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
    design_asset_id: Optional[int] = None


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


class SchedulePostRequest(BaseModel):
    platform: str
    message: str
    scheduled_at: datetime
    title: Optional[str] = None
    image_url: Optional[str] = None
    content_id: Optional[int] = None
    design_asset_id: Optional[int] = None
    campaign_id: Optional[int] = None


class ScheduledPostResponse(BaseModel):
    id: int
    user_id: int
    content_id: Optional[int] = None
    design_asset_id: Optional[int] = None
    campaign_id: Optional[int] = None
    title: Optional[str] = None
    platform: str
    message: str
    image_url: Optional[str] = None
    status: str
    scheduled_at: datetime
    published_at: Optional[datetime] = None
    post_id: Optional[str] = None
    target_name: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


@router.post("/connect/{platform}")
async def initiate_connection(
    platform: str,
    redirect_to: str | None = Query(default=None),
    current_user: User = Depends(get_current_authenticated_user),
):
    """Generate OAuth authorization URL for a social platform."""
    if platform not in VALID_PLATFORMS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported platform: {platform}. Supported: {', '.join(VALID_PLATFORMS)}",
        )

    try:
        url = SocialAuthService.get_authorization_url(platform, current_user.id, redirect_to=redirect_to)
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
    """Handle OAuth callback and redirect back to the originating page."""
    if platform not in VALID_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

    if error:
        desc = (error_description or error).replace('"', "")
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/settings?tab=social&error={platform}:{desc}"
        )

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing OAuth callback code/state")

    try:
        _, redirect_to = await SocialAuthService.handle_callback(platform, code, state, db)
        separator = "&" if "?" in redirect_to else "?"
        return RedirectResponse(f"{settings.FRONTEND_URL}{redirect_to}{separator}connected={platform}")
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
    """Settings view with RBAC visibility (self + descendants, super users = all)."""
    query = select(SocialConnection, User.email).join(User, SocialConnection.user_id == User.id)
    query = query.where(visible_user_filter(current_user, SocialConnection.user_id))

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
            await _mark_design_as_posted(
                design_asset_id=payload.design_asset_id,
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
    if payload.design_asset_id:
        design_row = await db.execute(
            select(DesignAsset).where(
                DesignAsset.id == payload.design_asset_id,
                DesignAsset.user_id == current_user.id,
            )
        )
        design_asset = design_row.scalar_one_or_none()
        if design_asset and design_asset.is_posted:
            raise HTTPException(
                status_code=409,
                detail="This design is already posted. Create a new design to post again.",
            )

    try:
        publish_response = await _publish_for_platform(
            platform=platform,
            message=payload.message,
            image_url=payload.image_url,
            design_asset_id=payload.design_asset_id,
            user_id=current_user.id,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if publish_response and publish_response.get("published"):
        await _mark_content_as_posted(
            content_id=payload.content_id,
            user_id=current_user.id,
            target_name=str(publish_response.get("target_name") or ""),
            db=db,
        )
        await _mark_design_as_posted(
            design_asset_id=payload.design_asset_id,
            user_id=current_user.id,
            target_name=str(publish_response.get("target_name") or ""),
            db=db,
        )

    return publish_response


@router.post("/scheduled-posts", response_model=ScheduledPostResponse)
async def create_scheduled_post(
    payload: SchedulePostRequest,
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    platform = (payload.platform or "").strip().lower()
    if platform not in {"linkedin", "facebook", "instagram"}:
        raise HTTPException(status_code=400, detail=f"Scheduling is not supported for platform: {payload.platform}")

    message = (payload.message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Post message is required")

    if platform == "instagram":
        image_url = (payload.image_url or "").strip()
        if not image_url:
            raise HTTPException(status_code=400, detail="Instagram scheduling requires image_url")
        if not image_url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail="Instagram requires a public image URL")

    scheduled_at = payload.scheduled_at
    if scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
    else:
        scheduled_at = scheduled_at.astimezone(timezone.utc)

    if scheduled_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Scheduled Time must be future")

    connection_result = await db.execute(
        select(SocialConnection).where(
            SocialConnection.user_id == current_user.id,
            SocialConnection.platform == platform,
            SocialConnection.is_active == True,  # noqa: E712
        )
    )
    connection = connection_result.scalar_one_or_none()
    if not connection or not connection.access_token:
        raise HTTPException(status_code=400, detail=f"Connect {platform} before scheduling a post")

    validated_content_id: Optional[int] = None
    validated_design_asset_id: Optional[int] = None
    if payload.content_id:
        if is_super_admin(current_user.role):
            content_result = await db.execute(
                select(ContentGeneration).where(ContentGeneration.id == payload.content_id)
            )
        else:
            content_result = await db.execute(
                select(ContentGeneration).where(
                    ContentGeneration.id == payload.content_id,
                    ContentGeneration.user_id == current_user.id,
                )
            )
        content_obj = content_result.scalar_one_or_none()
        # Do not block scheduling when content reference is stale/unavailable.
        # Scheduling should still work with raw message payload.
        if content_obj:
            validated_content_id = payload.content_id

    if payload.design_asset_id:
        design_result = await db.execute(
            select(DesignAsset).where(
                DesignAsset.id == payload.design_asset_id,
                DesignAsset.user_id == current_user.id,
            )
        )
        design_obj = design_result.scalar_one_or_none()
        if design_obj:
            if design_obj.is_posted:
                raise HTTPException(
                    status_code=409,
                    detail="This design is already posted. Create a new design to schedule again.",
                )
            validated_design_asset_id = payload.design_asset_id

    if payload.campaign_id:
        campaign_result = await db.execute(
            select(Campaign).where(
                Campaign.id == payload.campaign_id,
            )
        )
        if not campaign_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Campaign not found")

    # Prevent duplicate scheduling of the same content/design item.
    # Re-scheduling is allowed only if previous attempts failed/cancelled.
    blocking_statuses = {"scheduled", "processing", "published", "posted", "success", "completed"}
    retryable_statuses = {"failed", "error", "cancelled", "canceled"}
    raw_content_id = payload.content_id
    raw_design_asset_id = payload.design_asset_id
    normalized_title = (payload.title or "").strip() or None
    normalized_image_url = (payload.image_url or "").strip() or None

    reference_clauses = []
    effective_content_id = validated_content_id or raw_content_id
    effective_design_asset_id = validated_design_asset_id or raw_design_asset_id
    if effective_content_id:
        reference_clauses.append(ScheduledPost.content_id == effective_content_id)
    if effective_design_asset_id:
        reference_clauses.append(ScheduledPost.design_asset_id == effective_design_asset_id)

    # Fallback duplicate detection for cases where IDs are missing/stale:
    # treat same platform + same message + same title + same image as the same post.
    signature_clause = and_(
        ScheduledPost.message == message,
        ScheduledPost.title == normalized_title,
        ScheduledPost.image_url == normalized_image_url,
    )
    conflict_filters = [signature_clause]
    if reference_clauses:
        conflict_filters.append(or_(*reference_clauses))
    else:
        # Only when no durable references are available, use a relaxed fallback.
        # This prevents false positives for new design assets that happen to share the same text.
        conflict_filters.append(
            and_(
                ScheduledPost.message == message,
                ScheduledPost.title == normalized_title,
            )
        )

    conflict_query = select(ScheduledPost).where(
        ScheduledPost.user_id == current_user.id,
        ScheduledPost.platform == platform,
        or_(*conflict_filters),
    )
    existing_for_reference = (await db.execute(conflict_query)).scalars().all()

    has_blocking_schedule = any(
        (post.status or "").strip().lower() in blocking_statuses for post in existing_for_reference
    )
    has_retryable_only = existing_for_reference and all(
        (post.status or "").strip().lower() in retryable_statuses for post in existing_for_reference
    )

    if has_blocking_schedule and not has_retryable_only:
        raise HTTPException(
            status_code=409,
            detail="This post is already scheduled or has already been posted. You can re-schedule only after a failed scheduling attempt.",
        )

    scheduled = ScheduledPost(
        user_id=current_user.id,
        content_id=validated_content_id,
        design_asset_id=validated_design_asset_id,
        campaign_id=payload.campaign_id,
        title=normalized_title,
        platform=platform,
        message=message,
        image_url=normalized_image_url,
        status="scheduled",
        scheduled_at=scheduled_at,
    )
    db.add(scheduled)
    await db.commit()
    await db.refresh(scheduled)
    return _to_scheduled_post_response(scheduled)


@router.get("/scheduled-posts", response_model=list[ScheduledPostResponse])
async def list_scheduled_posts(
    status: Optional[str] = Query(default=None),
    status_in: Optional[str] = Query(default=None, description="Comma-separated statuses"),
    scope: Optional[Literal["content", "design"]] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=1000),
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(ScheduledPost)
        .where(visible_user_filter(current_user, ScheduledPost.user_id))
        .order_by(ScheduledPost.scheduled_at.asc())
    )

    if status:
        query = query.where(ScheduledPost.status == status.lower())
    elif status_in:
        statuses = [item.strip().lower() for item in status_in.split(",") if item.strip()]
        if statuses:
            query = query.where(ScheduledPost.status.in_(statuses))
    if from_date:
        normalized_from = from_date if from_date.tzinfo else from_date.replace(tzinfo=timezone.utc)
        query = query.where(ScheduledPost.scheduled_at >= normalized_from)
    if to_date:
        normalized_to = to_date if to_date.tzinfo else to_date.replace(tzinfo=timezone.utc)
        query = query.where(ScheduledPost.scheduled_at <= normalized_to)
    if scope == "content":
        query = query.where(ScheduledPost.content_id.is_not(None), ScheduledPost.design_asset_id.is_(None))
    elif scope == "design":
        query = query.where(
            or_(
                ScheduledPost.design_asset_id.is_not(None),
                ScheduledPost.content_id.is_(None),
            )
        )

    rows = (await db.execute(query.offset(skip).limit(limit))).scalars().all()
    return [_to_scheduled_post_response(row) for row in rows]


@router.post("/scheduled-posts/{scheduled_post_id}/cancel", response_model=ScheduledPostResponse)
async def cancel_scheduled_post(
    scheduled_post_id: int,
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    row_result = await db.execute(
        select(ScheduledPost).where(
            ScheduledPost.id == scheduled_post_id,
            visible_user_filter(current_user, ScheduledPost.user_id),
        )
    )
    scheduled = row_result.scalar_one_or_none()
    if not scheduled:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

    status = (scheduled.status or "").strip().lower()
    if status in {"published", "posted", "success", "completed"}:
        raise HTTPException(status_code=409, detail="Posted schedules cannot be canceled")
    if status in {"failed", "error", "cancelled", "canceled"}:
        return _to_scheduled_post_response(scheduled)

    if status not in {"scheduled", "processing", "queued", "pending"}:
        raise HTTPException(status_code=409, detail=f"Cannot cancel schedule with status: {scheduled.status}")

    scheduled.status = "canceled"
    scheduled.error_message = "Canceled by user"
    await db.commit()
    await db.refresh(scheduled)
    return _to_scheduled_post_response(scheduled)


@router.delete("/scheduled-posts/{scheduled_post_id}", response_model=ScheduledPostResponse)
async def cancel_scheduled_post_delete(
    scheduled_post_id: int,
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    # Compatibility route: some clients use DELETE /scheduled-posts/{id}
    return await cancel_scheduled_post(scheduled_post_id=scheduled_post_id, current_user=current_user, db=db)


@router.post("/scheduled-posts/{scheduled_post_id}/cancel/", response_model=ScheduledPostResponse)
async def cancel_scheduled_post_with_trailing_slash(
    scheduled_post_id: int,
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    # Compatibility route: handles proxy/client trailing slash behavior.
    return await cancel_scheduled_post(scheduled_post_id=scheduled_post_id, current_user=current_user, db=db)


@router.post("/scheduled-posts/cancel/{scheduled_post_id}", response_model=ScheduledPostResponse)
async def cancel_scheduled_post_alt_path(
    scheduled_post_id: int,
    current_user: User = Depends(get_current_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    # Compatibility route: handles alternate REST path used by some clients.
    return await cancel_scheduled_post(scheduled_post_id=scheduled_post_id, current_user=current_user, db=db)


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


async def _publish_for_platform(
    platform: str,
    message: str,
    image_url: Optional[str],
    design_asset_id: Optional[int],
    user_id: int,
    db: AsyncSession,
) -> dict:
    normalized_platform = (platform or "").strip().lower()
    if normalized_platform == "linkedin":
        image_bytes: Optional[bytes] = None
        if image_url:
            image_bytes = await _resolve_linkedin_image_bytes(image_url)
        data = await SocialAuthService.publish_linkedin_post(
            user_id=user_id,
            text=message,
            db=db,
            image_bytes=image_bytes,
        )
        return _normalize_publish_response(
            platform="linkedin",
            data=data,
            fallback_target_name="LinkedIn",
        )

    if normalized_platform == "facebook":
        resolved_image_url = (image_url or "").strip() or None
        # For Design Studio assets, prefer raw stored image payload (usually data URL/base64)
        # over frontend-rendered API URLs that Facebook cannot fetch.
        if design_asset_id:
            design_result = await db.execute(
                select(DesignAsset).where(
                    DesignAsset.id == design_asset_id,
                    DesignAsset.user_id == user_id,
                )
            )
            design_asset = design_result.scalar_one_or_none()
            if design_asset and getattr(design_asset, "image_url", None):
                resolved_image_url = str(design_asset.image_url)

        data = await SocialAuthService.publish_facebook_post(
            user_id=user_id,
            message=message,
            db=db,
            image_url=resolved_image_url,
        )
        return _normalize_publish_response(
            platform="facebook",
            data=data,
            fallback_target_name="Facebook",
        )

    if normalized_platform == "instagram":
        data = await SocialAuthService.publish_instagram_post(
            user_id=user_id,
            caption=message,
            image_url=(image_url or "").strip(),
            db=db,
        )
        return _normalize_publish_response(
            platform="instagram",
            data=data,
            fallback_target_name="Instagram",
        )

    raise ValueError(f"Publishing not supported for platform: {platform}")


def _to_scheduled_post_response(post: ScheduledPost) -> ScheduledPostResponse:
    return ScheduledPostResponse(
        id=post.id,
        user_id=post.user_id,
        content_id=post.content_id,
        design_asset_id=post.design_asset_id,
        campaign_id=post.campaign_id,
        title=post.title,
        platform=post.platform,
        message=post.message,
        image_url=post.image_url,
        status=post.status,
        scheduled_at=post.scheduled_at,
        published_at=post.published_at,
        post_id=post.post_id,
        target_name=post.target_name,
        error_message=post.error_message,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


async def process_due_scheduled_posts(
    db: AsyncSession,
    limit: int = 20,
) -> int:
    now = datetime.now(timezone.utc)
    due_result = await db.execute(
        select(ScheduledPost)
        .where(
            ScheduledPost.status == "scheduled",
            ScheduledPost.scheduled_at <= now,
        )
        .order_by(ScheduledPost.scheduled_at.asc())
        .limit(limit)
    )
    due_posts = due_result.scalars().all()
    published_count = 0

    for post in due_posts:
        post.status = "processing"
        post.error_message = None
        await db.commit()
        await db.refresh(post)

        try:
            publish_response = await _publish_for_platform(
                platform=post.platform,
                message=post.message,
                image_url=post.image_url,
                design_asset_id=post.design_asset_id,
                user_id=post.user_id,
                db=db,
            )
            if not publish_response.get("published"):
                raise ValueError(f"Unexpected publish response for {post.platform}")

            post.status = "published"
            post.post_id = (
                str(publish_response.get("post_id"))
                if publish_response.get("post_id") is not None
                else None
            )
            post.target_name = str(publish_response.get("target_name") or "").strip() or None
            post.published_at = datetime.now(timezone.utc)
            await _mark_content_as_posted(
                content_id=post.content_id,
                user_id=post.user_id,
                target_name=post.target_name or post.platform,
                db=db,
            )
            await _mark_design_as_posted(
                design_asset_id=post.design_asset_id,
                user_id=post.user_id,
                target_name=post.target_name or post.platform,
                db=db,
            )
            published_count += 1
        except Exception as exc:  # noqa: BLE001
            post.status = "failed"
            post.error_message = str(exc)[:2000]
        finally:
            await db.commit()

    return published_count


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


async def _mark_design_as_posted(
    design_asset_id: Optional[int],
    user_id: int,
    target_name: str,
    db: AsyncSession,
) -> None:
    if not design_asset_id:
        return

    result = await db.execute(
        select(DesignAsset).where(
            DesignAsset.id == design_asset_id,
            DesignAsset.user_id == user_id,
        )
    )
    asset = result.scalar_one_or_none()
    if not asset:
        return

    if asset.is_posted:
        return

    asset.is_posted = True
    asset.posted_at = datetime.now(timezone.utc)
    asset.posted_target_name = target_name or None
    await db.commit()
