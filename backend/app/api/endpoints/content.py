import re
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_content_read, require_content_write
from app.core.database import get_db
from app.models import models
from app.models.models import User
from app.schemas import schemas
from app.services.ai_service import AIService

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


@router.get("/", response_model=List[schemas.ContentGeneration])
async def get_content_generations(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_content_read),
):
    if current_user.role == "super_admin":
        result = await db.execute(
            select(models.ContentGeneration)
            .order_by(models.ContentGeneration.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
    else:
        result = await db.execute(
            select(models.ContentGeneration)
            .where(models.ContentGeneration.user_id == current_user.id)
            .order_by(models.ContentGeneration.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
    return result.scalars().all()


@router.get("/{content_id}", response_model=schemas.ContentGeneration)
async def get_content_generation(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_content_read),
):
    if current_user.role == "super_admin":
        result = await db.execute(
            select(models.ContentGeneration).where(models.ContentGeneration.id == content_id)
        )
    else:
        result = await db.execute(
            select(models.ContentGeneration)
            .where(
                (models.ContentGeneration.id == content_id)
                & (models.ContentGeneration.user_id == current_user.id)
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
    current_user: User = Depends(require_content_write),
):
    try:
        normalized_title = _normalize_platform_title(request.title, request.platform)
        generated_text = await AIService.generate_content(
            normalized_title,
            request.platform,
            request.content_type,
            request.prompt,
            request.model,
        )
        return {
            "title": normalized_title,
            "platform": request.platform,
            "content_type": request.content_type,
            "prompt": request.prompt,
            "result": generated_text,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save", response_model=schemas.ContentGeneration)
async def save_content(
    request: schemas.ContentGenerationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_content_write),
):
    try:
        normalized_title = _normalize_platform_title(request.title, request.platform)

        if request.id:
            if current_user.role == "super_admin":
                result = await db.execute(
                    select(models.ContentGeneration).where(
                        models.ContentGeneration.id == request.id
                    )
                )
            else:
                result = await db.execute(
                    select(models.ContentGeneration).where(
                        (models.ContentGeneration.id == request.id)
                        & (models.ContentGeneration.user_id == current_user.id)
                    )
                )
            db_content = result.scalar_one_or_none()

            if not db_content:
                raise HTTPException(status_code=404, detail="Content not found")

            db_content.title = normalized_title
            db_content.platform = request.platform
            db_content.content_type = request.content_type
            db_content.prompt = request.prompt
            db_content.result = request.result
        else:
            db_content = models.ContentGeneration(
                title=normalized_title,
                platform=request.platform,
                content_type=request.content_type,
                prompt=request.prompt,
                result=request.result,
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
    current_user: User = Depends(require_content_write),
):
    try:
        normalized_title = _normalize_platform_title(request.title, request.platform)

        if current_user.role == "super_admin":
            result = await db.execute(
                select(models.ContentGeneration).where(models.ContentGeneration.id == content_id)
            )
        else:
            result = await db.execute(
                select(models.ContentGeneration).where(
                    (models.ContentGeneration.id == content_id)
                    & (models.ContentGeneration.user_id == current_user.id)
                )
            )
        db_content = result.scalar_one_or_none()

        if not db_content:
            raise HTTPException(status_code=404, detail="Content not found")

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
    current_user: User = Depends(require_content_write),
):
    if current_user.role == "super_admin":
        result = await db.execute(
            select(models.ContentGeneration).where(models.ContentGeneration.id == content_id)
        )
    else:
        result = await db.execute(
            select(models.ContentGeneration).where(
                (models.ContentGeneration.id == content_id)
                & (models.ContentGeneration.user_id == current_user.id)
            )
        )
    content = result.scalar_one_or_none()
    if content is None:
        raise HTTPException(status_code=404, detail="Content generation not found")
    await db.delete(content)
    await db.commit()
    return {"message": "Content deleted successfully"}
