from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.services.ai_service import AIService
from app.api.deps import require_content_read, require_content_write
from app.models.models import User
from typing import List

router = APIRouter()

@router.get("/", response_model=List[schemas.ContentGeneration])
async def get_content_generations(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_content_read)
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
            .join(User)
            .where(User.organization_id == current_user.organization_id)
            .order_by(models.ContentGeneration.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
    return result.scalars().all()

@router.get("/{content_id}", response_model=schemas.ContentGeneration)
async def get_content_generation(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_content_read)
):
    if current_user.role == "super_admin":
        result = await db.execute(
            select(models.ContentGeneration).where(models.ContentGeneration.id == content_id)
        )
    else:
        result = await db.execute(
            select(models.ContentGeneration)
            .join(User, models.ContentGeneration.user_id == User.id)
            .where(
                (models.ContentGeneration.id == content_id) &
                (User.organization_id == current_user.organization_id)
            )
        )
    content = result.scalar_one_or_none()
    if content is None:
        raise HTTPException(status_code=404, detail="Content generation not found")
    return content

@router.post("/generate", response_model=schemas.ContentGeneration)
async def generate_content(
    request: schemas.ContentGenerationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_content_write)
):
    try:
        generated_text = await AIService.generate_content(
            request.platform, request.content_type, request.prompt
        )
        db_content = models.ContentGeneration(
            title=f"{request.platform} Post - {request.title}",
            platform=request.platform,
            content_type=request.content_type,
            prompt=request.prompt,
            result=generated_text,
            user_id=current_user.id
        )
        db.add(db_content)
        await db.commit()
        await db.refresh(db_content)
        return db_content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{content_id}")
async def delete_content_generation(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_content_write)
):
    if current_user.role == "super_admin":
        result = await db.execute(
            select(models.ContentGeneration).where(models.ContentGeneration.id == content_id)
        )
    else:
        result = await db.execute(
            select(models.ContentGeneration)
            .join(User, models.ContentGeneration.user_id == User.id)
            .where(
                (models.ContentGeneration.id == content_id) &
                (User.organization_id == current_user.organization_id)
            )
        )
    content = result.scalar_one_or_none()
    if content is None:
        raise HTTPException(status_code=404, detail="Content generation not found")
    await db.delete(content)
    await db.commit()
    return {"message": "Content deleted successfully"}
