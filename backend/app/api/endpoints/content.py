import re
import asyncio
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_active_user,
)
from app.core.database import get_db
from app.models import models
from app.models.models import User
from app.schemas import schemas
from app.services.ai_service import AIService
from app.services.auth_service import is_super_admin
from app.services.permission_engine import PermissionEngine
from app.services.rbac_scope import visible_user_filter

router = APIRouter()


def _normalize_platform_title(title: str, platform: str) -> str:
    normalized = (title or "").strip()
    platform_value = (platform or "").strip()
    if not platform_value:
        return normalized

    suffix_pattern = re.compile(rf"\s*\({re.escape(platform_value)}\)\s*$", re.IGNORECASE)
    while suffix_pattern.search(normalized):
        normalized = suffix_pattern.sub("", normalized).strip()

    return f"{normalized} ({platform_value})" if normalized else f"({platform_value})"


def _has_content_permission(engine: PermissionEngine, action: str) -> bool:
    # Backward compatibility: support both legacy "content" and module key "content_studio".
    return engine.has_permission("content", action) or engine.has_permission("content_studio", action)


def _require_content_action(current_user: User, action: str) -> None:
    engine = PermissionEngine.from_loaded_user(current_user)
    if not _has_content_permission(engine, action):
        raise HTTPException(status_code=403, detail=f"Permission denied for content:{action}")


@router.get("/", response_model=List[schemas.ContentGeneration])
async def get_content_generations(
    skip: int = 0,
    limit: int = 100,
    q: str | None = Query(default=None),
    platform: str | None = Query(default=None),
    response: Response = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _require_content_action(current_user, "read")
    filters = []
    if not is_super_admin(current_user.role):
        filters.append(visible_user_filter(current_user, models.ContentGeneration.user_id))
    if q:
        search = f"%{q.strip()}%"
        filters.append(
            (models.ContentGeneration.title.ilike(search))
            | (models.ContentGeneration.result.ilike(search))
        )
    if platform and platform != "All Platforms":
        filters.append(models.ContentGeneration.platform == platform)

    total_query = select(func.count(models.ContentGeneration.id))
    if filters:
        total_query = total_query.where(*filters)
    total = (await db.execute(total_query)).scalar() or 0
    if response is not None:
        response.headers["X-Total-Count"] = str(total)

    list_query = (
        select(models.ContentGeneration)
        .order_by(models.ContentGeneration.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if filters:
        list_query = list_query.where(*filters)

    result = await db.execute(list_query)
    return result.scalars().all()


@router.get("/{content_id}", response_model=schemas.ContentGeneration)
async def get_content_generation(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _require_content_action(current_user, "read")
    if is_super_admin(current_user.role):
        result = await db.execute(
            select(models.ContentGeneration).where(models.ContentGeneration.id == content_id)
        )
    else:
        result = await db.execute(
            select(models.ContentGeneration)
            .where(
                (models.ContentGeneration.id == content_id)
                & visible_user_filter(current_user, models.ContentGeneration.user_id)
            )
        )
    content = result.scalar_one_or_none()
    if content is None:
        raise HTTPException(status_code=404, detail="Content generation not found")
    return content


@router.post("/generate")
async def generate_content(
    request: schemas.ContentGenerationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _require_content_action(current_user, "create")
    try:
        normalized_title = _normalize_platform_title(request.title, request.platform)
        generate_with_image = bool(request.generate_with_image)
        if request.adapt_from_base and (request.base_result or "").strip():
            generated_text = await AIService.adapt_content_for_platform(
                base_text=request.base_result or "",
                platform=request.platform,
                content_type=request.content_type,
                model=request.model,
            )
            generated_image = request.image_url
            image_model_used = "provided"
            image_fallback_used = False
        else:
            generated_text, generated_image_payload = await asyncio.gather(
                AIService.generate_content(
                    normalized_title,
                    request.platform,
                    request.content_type,
                    request.prompt,
                    request.model,
                ),
                AIService.generate_image(
                    title=normalized_title,
                    style="Minimalist",
                    prompt=request.prompt,
                    aspect_ratio="1:1",
                    brand_colors=request.brand_colors,
                    model="NanoBanana",
                    return_meta=True,
                ) if generate_with_image else asyncio.sleep(0, result=None),
            )
            generated_image = (
                generated_image_payload.get("image_url")
                if isinstance(generated_image_payload, dict)
                else None
            )
            image_model_used = (
                generated_image_payload.get("image_model_used")
                if isinstance(generated_image_payload, dict)
                else None
            )
            image_fallback_used = bool(
                generated_image_payload.get("image_fallback_used")
            ) if isinstance(generated_image_payload, dict) else False
        return {
            "title": normalized_title,
            "platform": request.platform,
            "content_type": request.content_type,
            "prompt": request.prompt,
            "result": generated_text,
            "image_url": generated_image,
            "brand_colors": request.brand_colors,
            "generate_with_image": generate_with_image,
            "text_model_used": AIService.get_effective_content_model_name(request.model),
            "image_model_used": image_model_used if generate_with_image else None,
            "image_fallback_used": image_fallback_used if generate_with_image else False,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save", response_model=schemas.ContentGeneration)
async def save_content(
    request: schemas.ContentGenerationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        normalized_title = _normalize_platform_title(request.title, request.platform)
        engine = PermissionEngine.from_loaded_user(current_user)

        if request.id:
            if not _has_content_permission(engine, "update"):
                raise HTTPException(status_code=403, detail="Permission denied for content:update")
            if is_super_admin(current_user.role):
                result = await db.execute(
                    select(models.ContentGeneration).where(
                        models.ContentGeneration.id == request.id
                    )
                )
            else:
                result = await db.execute(
                    select(models.ContentGeneration).where(
                        (models.ContentGeneration.id == request.id)
                        & visible_user_filter(current_user, models.ContentGeneration.user_id)
                    )
                )
            db_content = result.scalar_one_or_none()

            if not db_content:
                raise HTTPException(status_code=404, detail="Content not found")
            if db_content.is_posted:
                raise HTTPException(
                    status_code=409,
                    detail="Posted content is read-only. Create a new content draft to edit.",
                )

            db_content.title = normalized_title
            db_content.platform = request.platform
            db_content.content_type = request.content_type
            db_content.prompt = request.prompt
            db_content.result = request.result
            db_content.image_url = request.image_url
            db_content.brand_colors = request.brand_colors
            db_content.generate_with_image = bool(request.generate_with_image)
        else:
            if not _has_content_permission(engine, "create"):
                raise HTTPException(status_code=403, detail="Permission denied for content:create")
            db_content = models.ContentGeneration(
                title=normalized_title,
                platform=request.platform,
                content_type=request.content_type,
                prompt=request.prompt,
                result=request.result,
                image_url=request.image_url,
                brand_colors=request.brand_colors,
                generate_with_image=bool(request.generate_with_image),
                user_id=current_user.id,
            )
            db.add(db_content)

        await db.commit()
        await db.refresh(db_content)
        return db_content
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{content_id}", response_model=schemas.ContentGeneration)
async def update_content(
    content_id: int,
    request: schemas.ContentGenerationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _require_content_action(current_user, "update")
    try:
        normalized_title = _normalize_platform_title(request.title, request.platform)

        if is_super_admin(current_user.role):
            result = await db.execute(
                select(models.ContentGeneration).where(models.ContentGeneration.id == content_id)
            )
        else:
            result = await db.execute(
                select(models.ContentGeneration).where(
                    (models.ContentGeneration.id == content_id)
                    & visible_user_filter(current_user, models.ContentGeneration.user_id)
                )
            )
        db_content = result.scalar_one_or_none()

        if not db_content:
            raise HTTPException(status_code=404, detail="Content not found")
        if db_content.is_posted:
            raise HTTPException(
                status_code=409,
                detail="Posted content is read-only. Create a new content draft to edit.",
            )

        new_text = await AIService.generate_content(
            normalized_title,
            request.platform,
            request.content_type,
            request.prompt,
            request.model,
        )

        db_content.title = normalized_title
        db_content.platform = request.platform
        db_content.content_type = request.content_type
        db_content.prompt = request.prompt
        db_content.result = new_text
        db_content.image_url = request.image_url
        db_content.brand_colors = request.brand_colors
        db_content.generate_with_image = bool(request.generate_with_image)

        await db.commit()
        await db.refresh(db_content)
        return db_content
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{content_id}")
async def delete_content_generation(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _require_content_action(current_user, "delete")
    if is_super_admin(current_user.role):
        result = await db.execute(
            select(models.ContentGeneration).where(models.ContentGeneration.id == content_id)
        )
    else:
        result = await db.execute(
            select(models.ContentGeneration).where(
                (models.ContentGeneration.id == content_id)
                & visible_user_filter(current_user, models.ContentGeneration.user_id)
            )
        )
    content = result.scalar_one_or_none()
    if content is None:
        raise HTTPException(status_code=404, detail="Content generation not found")

    # Keep scheduled-post history while allowing content deletion.
    scheduled_refs = await db.execute(
        select(models.ScheduledPost).where(models.ScheduledPost.content_id == content.id)
    )
    for scheduled_post in scheduled_refs.scalars().all():
        scheduled_post.content_id = None

    await db.delete(content)
    await db.commit()
    return {"message": "Content deleted successfully"}
