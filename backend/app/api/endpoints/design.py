from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.services.ai_service import AIService
from app.api.deps import (
    get_current_active_user, require_design_read, require_design_write
)
from app.models.models import User
from typing import List
import base64
import io

router = APIRouter()

@router.get("/{asset_id}/image")
async def get_design_image(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_design_read)
):
    if current_user.role == "super_admin":
        result = await db.execute(
            select(models.DesignAsset).where(models.DesignAsset.id == asset_id)
        )
    else:
        result = await db.execute(
            select(models.DesignAsset)
            .join(User, models.DesignAsset.user_id == User.id)
            .where(
                (models.DesignAsset.id == asset_id) &
                (User.organization_id == current_user.organization_id)
            )
        )
    asset = result.scalar_one_or_none()
    if not asset or not asset.image_url:
        raise HTTPException(status_code=404, detail="Image not found")
    try:
        base64_str = asset.image_url
        if "base64," in base64_str:
            base64_str = base64_str.split("base64,")[1]
        image_data = base64.b64decode(base64_str)
        return StreamingResponse(io.BytesIO(image_data), media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error serving image")

@router.get("", response_model=List[schemas.DesignAsset])
async def get_design_assets(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_design_read)
):
    if current_user.role == "super_admin":
        result = await db.execute(
            select(models.DesignAsset)
            .order_by(models.DesignAsset.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
    else:
        result = await db.execute(
            select(models.DesignAsset)
            .join(User, models.DesignAsset.user_id == User.id)
            .where(User.organization_id == current_user.organization_id)
            .order_by(models.DesignAsset.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
    
    assets = result.scalars().all()
    response_data = []
    for asset in assets:
        asset_schema = schemas.DesignAsset.model_validate(asset)
        asset_schema.image_url = f"http://127.0.0.1:8000/api/v1/design/{asset.id}/image"
        response_data.append(asset_schema)
    return response_data

@router.get("/{asset_id}", response_model=schemas.DesignAsset)
async def get_design_asset(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_design_read)
):
    if current_user.role == "super_admin":
        result = await db.execute(
            select(models.DesignAsset).where(models.DesignAsset.id == asset_id)
        )
    else:
        result = await db.execute(
            select(models.DesignAsset)
            .join(User, models.DesignAsset.user_id == User.id)
            .where(
                (models.DesignAsset.id == asset_id) &
                (User.organization_id == current_user.organization_id)
            )
        )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Design asset not found")
    
    asset_schema = schemas.DesignAsset.model_validate(asset)
    asset_schema.image_url = f"http://127.0.0.1:8000/api/v1/design/{asset.id}/image"
    return asset_schema

@router.post("/generate", response_model=schemas.DesignAsset)
async def generate_design(
    request: schemas.DesignAssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_design_write)
):
    try:
        image_url = await AIService.generate_image(
            request.style, request.prompt, request.aspect_ratio, request.reference_image
        )
        db_asset = models.DesignAsset(
            title=request.title,
            style=request.style,
            aspect_ratio=request.aspect_ratio,
            prompt=request.prompt,
            image_url=image_url,
            brand_colors=request.brand_colors,
            reference_image=request.reference_image,
            user_id=current_user.id
        )
        db.add(db_asset)
        await db.commit()
        await db.refresh(db_asset)
        
        asset_schema = schemas.DesignAsset.model_validate(db_asset)
        asset_schema.image_url = f"http://127.0.0.1:8000/api/v1/design/{db_asset.id}/image"
        return asset_schema
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{asset_id}", response_model=schemas.DesignAsset)
async def update_design_asset(
    asset_id: int,
    request: schemas.DesignAssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_design_write)
):
    if current_user.role == "super_admin":
        result = await db.execute(
            select(models.DesignAsset).where(models.DesignAsset.id == asset_id)
        )
    else:
        result = await db.execute(
            select(models.DesignAsset)
            .join(User, models.DesignAsset.user_id == User.id)
            .where(
                (models.DesignAsset.id == asset_id) &
                (User.organization_id == current_user.organization_id)
            )
        )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Design asset not found")
    asset.title = request.title
    asset.style = request.style
    asset.aspect_ratio = request.aspect_ratio
    asset.prompt = request.prompt
    asset.brand_colors = request.brand_colors
    asset.reference_image = request.reference_image
    await db.commit()
    await db.refresh(asset)
    asset_schema = schemas.DesignAsset.model_validate(asset)
    asset_schema.image_url = f"http://127.0.0.1:8000/api/v1/design/{asset.id}/image"
    return asset_schema

@router.delete("/{asset_id}")
async def delete_design_asset(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_design_write)
):
    if current_user.role == "super_admin":
        result = await db.execute(
            select(models.DesignAsset).where(models.DesignAsset.id == asset_id)
        )
    else:
        result = await db.execute(
            select(models.DesignAsset)
            .join(User, models.DesignAsset.user_id == User.id)
            .where(
                (models.DesignAsset.id == asset_id) &
                (User.organization_id == current_user.organization_id)
            )
        )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Design asset not found")
    await db.delete(asset)
    await db.commit()
    return {"message": "Design asset deleted successfully"}
