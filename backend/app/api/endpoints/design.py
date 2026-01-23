from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.services.ai_service import AIService
from typing import List

router = APIRouter()

@router.get("/", response_model=List[schemas.DesignAsset])
async def get_design_assets(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.DesignAsset).order_by(models.DesignAsset.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{asset_id}", response_model=schemas.DesignAsset)
async def get_design_asset(asset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.DesignAsset).where(models.DesignAsset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Design asset not found")
    return asset

@router.post("/generate", response_model=schemas.DesignAsset)
async def generate_design(request: schemas.DesignAssetCreate, db: AsyncSession = Depends(get_db)):
    # 1. Generate Image URL via Service
    image_url = await AIService.generate_image(request.style, request.prompt)
    
    # 2. Save to DB
    db_asset = models.DesignAsset(
        title=request.title,
        style=request.style,
        aspect_ratio=request.aspect_ratio,
        prompt=request.prompt,
        image_url=image_url,
        brand_colors=request.brand_colors,
        reference_image=request.reference_image,
        user_id=1 # Default User
    )
    db.add(db_asset)
    await db.commit()
    await db.refresh(db_asset)
    
    return db_asset
