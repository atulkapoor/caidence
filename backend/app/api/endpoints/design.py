from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.services.ai_service import AIService
from typing import List
import base64
import io

router = APIRouter()

@router.get("/{asset_id}/image")
async def get_design_image(asset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.DesignAsset).where(models.DesignAsset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset or not asset.image_url:
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        # Check if it is a data URI or raw base64
        base64_str = asset.image_url
        if "base64," in base64_str:
            base64_str = base64_str.split("base64,")[1]
            
        image_data = base64.b64decode(base64_str)
        return StreamingResponse(io.BytesIO(image_data), media_type="image/png")
    except Exception as e:
        print(f"Error serving image {asset_id}: {e}")
        raise HTTPException(status_code=500, detail="Error serving image")

@router.get("", response_model=List[schemas.DesignAsset])
async def get_design_assets(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.DesignAsset).order_by(models.DesignAsset.created_at.desc()).offset(skip).limit(limit))
    assets = result.scalars().all()
    # Explicitly convert to Pydantic model to ensure image_url override persists
    response_data = []
    for asset in assets:
        # Use model_validate to convert ORM -> Pydantic
        asset_schema = schemas.DesignAsset.model_validate(asset)
        asset_schema.image_url = f"/api/v1/design/{asset.id}/image"
        response_data.append(asset_schema)
    return response_data

@router.get("/{asset_id}", response_model=schemas.DesignAsset)
async def get_design_asset(asset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.DesignAsset).where(models.DesignAsset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Design asset not found")
    
    asset_schema = schemas.DesignAsset.model_validate(asset)
    asset_schema.image_url = f"/api/v1/design/{asset.id}/image"
    return asset_schema

@router.post("/generate", response_model=schemas.DesignAsset)
async def generate_design(request: schemas.DesignAssetCreate, db: AsyncSession = Depends(get_db)):
    # 1. Generate Image URL via Service (returns Base64)
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
    
    # Return URL instead of Base64
    asset_schema = schemas.DesignAsset.model_validate(db_asset)
    asset_schema.image_url = f"/api/v1/design/{db_asset.id}/image"
    return asset_schema
