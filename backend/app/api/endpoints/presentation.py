from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.services.ai_service import AIService
from typing import List

router = APIRouter()

@router.post("/generate", response_model=schemas.Presentation)
async def generate_presentation(request: schemas.PresentationCreate, db: AsyncSession = Depends(get_db)):
    # 1. Generate Slides via Service
    slides_json = await AIService.generate_presentation_slides(request.source_type, request.title)
    
    # 2. Save to DB
    db_presentation = models.Presentation(
        title=request.title,
        source_type=request.source_type,
        slides_json=slides_json,
        slide_count=12, # Mock count
        user_id=1 # Default User
    )
    db.add(db_presentation)
    await db.commit()
    await db.refresh(db_presentation)
    
    return db_presentation

@router.get("/", response_model=List[schemas.Presentation])
async def get_presentations(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Presentation).order_by(models.Presentation.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{presentation_id}", response_model=schemas.Presentation)
async def get_presentation(presentation_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Presentation).where(models.Presentation.id == presentation_id))
    presentation = result.scalar_one_or_none()
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    return presentation
