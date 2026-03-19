from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.services.ai_service import AIService
from app.api.deps import (
    get_current_active_user, require_design_read, require_design_create, require_design_update, require_design_delete
)
from app.models.models import User
from typing import List
import base64
import io
from app.services.auth_service import is_super_admin
from app.services.rbac_scope import visible_user_filter

router = APIRouter()

@router.get("/{asset_id}/image")
async def get_design_image(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_design_read)
):
    if is_super_admin(current_user.role):
        result = await db.execute(
            select(models.DesignAsset).where(models.DesignAsset.id == asset_id)
        )
    else:
        result = await db.execute(
            select(models.DesignAsset)
            .where(
                (models.DesignAsset.id == asset_id)
                & visible_user_filter(current_user, models.DesignAsset.user_id)
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
    q: str | None = Query(default=None),
    style: str | None = Query(default=None),
    response: Response = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_design_read)
):
    filters = []
    if not is_super_admin(current_user.role):
        filters.append(visible_user_filter(current_user, models.DesignAsset.user_id))
    if q:
        search = f"%{q.strip()}%"
        filters.append(
            (models.DesignAsset.title.ilike(search))
            | (models.DesignAsset.prompt.ilike(search))
        )
    if style and style != "All Types":
        filters.append(models.DesignAsset.style == style)

    total_query = select(func.count(models.DesignAsset.id))
    if filters:
        total_query = total_query.where(*filters)
    total = (await db.execute(total_query)).scalar() or 0
    if response is not None:
        response.headers["X-Total-Count"] = str(total)

    list_query = (
        select(models.DesignAsset)
        .order_by(models.DesignAsset.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if filters:
        list_query = list_query.where(*filters)
    result = await db.execute(list_query)
    
    assets = result.scalars().all()
    response_data = []
    for asset in assets:
        asset_schema = schemas.DesignAsset.model_validate(asset)
        asset_schema.image_url = f"/api/v1/design/{asset.id}/image"
        response_data.append(asset_schema)
    return response_data

@router.get("/{asset_id}", response_model=schemas.DesignAsset)
async def get_design_asset(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_design_read)
):
    if is_super_admin(current_user.role):
        result = await db.execute(
            select(models.DesignAsset).where(models.DesignAsset.id == asset_id)
        )
    else:
        result = await db.execute(
            select(models.DesignAsset)
            .where(
                (models.DesignAsset.id == asset_id)
                & visible_user_filter(current_user, models.DesignAsset.user_id)
            )
        )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Design asset not found")
    
    asset_schema = schemas.DesignAsset.model_validate(asset)
    asset_schema.image_url = f"/api/v1/design/{asset.id}/image"
    return asset_schema

@router.post("/generate")
async def generate_design(
    request: schemas.DesignAssetCreate,
    current_user: User = Depends(require_design_create)
):
    try:
        image_payload = await AIService.generate_image(
            title=request.title,
            style=request.style,
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            brand_colors=request.brand_colors,
            reference_image=request.reference_image,
            model=request.model,
            return_meta=True,
        )
        image_url = image_payload.get("image_url") if isinstance(image_payload, dict) else image_payload

        # Return only generated image
        return {
            "title": request.title,
            "style": request.style,
            "aspect_ratio": request.aspect_ratio,
            "prompt": request.prompt,
            "image_url": image_url,
            "brand_colors": request.brand_colors,
            "reference_image": request.reference_image,
            "brand_id": request.brand_id,
            "image_model_used": image_payload.get("image_model_used") if isinstance(image_payload, dict) else None,
            "image_fallback_used": bool(image_payload.get("image_fallback_used")) if isinstance(image_payload, dict) else False,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save", response_model=schemas.DesignAsset)
async def save_design(
    request: schemas.DesignAssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from app.services.permission_engine import PermissionEngine

    try:
        engine = PermissionEngine.from_loaded_user(current_user)
        def looks_like_url(value: str) -> bool:
            return value.startswith(("http://", "https://", "/"))

        # ✅ EDIT MODE → update existing
        if request.id:
            if not engine.has_permission("design_studio", "update"):
                raise HTTPException(status_code=403, detail="Permission denied for design_studio:update")
            if is_super_admin(current_user.role):
                result = await db.execute(
                    select(models.DesignAsset).where(
                        models.DesignAsset.id == request.id
                    )
                )
            else:
                result = await db.execute(
                    select(models.DesignAsset).where(
                        (models.DesignAsset.id == request.id)
                        & visible_user_filter(current_user, models.DesignAsset.user_id)
                    )
                )
            db_asset = result.scalar_one_or_none()

            if not db_asset:
                raise HTTPException(status_code=404, detail="Design not found")

            # ⭐ Update fields
            db_asset.title = request.title
            db_asset.style = request.style
            db_asset.aspect_ratio = request.aspect_ratio
            db_asset.prompt = request.prompt
            db_asset.brand_colors = request.brand_colors
            db_asset.reference_image = request.reference_image
            if request.image_url and looks_like_url(request.image_url) and db_asset.image_url:
                # Preserve stored base64; frontend sends public preview URLs when editing.
                pass
            else:
                db_asset.image_url = request.image_url
            db_asset.brand_id = request.brand_id

        # ✅ CREATE MODE
        else:
            if not engine.has_permission("design_studio", "create"):
                raise HTTPException(status_code=403, detail="Permission denied for design_studio:create")
            db_asset = models.DesignAsset(
                title=request.title,
                style=request.style,
                aspect_ratio=request.aspect_ratio,
                prompt=request.prompt,
                image_url=request.image_url,
                brand_colors=request.brand_colors,
                reference_image=request.reference_image,
                user_id=current_user.id,
                brand_id=request.brand_id,
            )

            db.add(db_asset)

        await db.commit()
        await db.refresh(db_asset)

        return db_asset

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.put("/{asset_id}", response_model=schemas.DesignAsset)
async def update_design_asset(
    asset_id: int,
    request: schemas.DesignAssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_design_update)
):
    # Fetch design
    if is_super_admin(current_user.role):
        result = await db.execute(
            select(models.DesignAsset).where(models.DesignAsset.id == asset_id)
        )
    else:
        result = await db.execute(
            select(models.DesignAsset)
            .where(
                (models.DesignAsset.id == asset_id)
                & visible_user_filter(current_user, models.DesignAsset.user_id)
            )
        )

    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(status_code=404, detail="Design asset not found")

    # ⭐ Regenerate image
    new_image = await AIService.generate_image(
        title=request.title,
        style=request.style,
        prompt=request.prompt,
        aspect_ratio=request.aspect_ratio,
        brand_colors=request.brand_colors,
        reference_image=request.reference_image,
        model=request.model,
    )

    # ⭐ Update fields
    asset.title = request.title
    asset.style = request.style
    asset.aspect_ratio = request.aspect_ratio
    asset.prompt = request.prompt
    asset.brand_colors = request.brand_colors
    asset.reference_image = request.reference_image
    asset.image_url = new_image  # ⭐ IMPORTANT
    asset.brand_id = request.brand_id

    await db.commit()
    await db.refresh(asset)

    asset_schema = schemas.DesignAsset.model_validate(asset)
    asset_schema.image_url = f"/api/v1/design/{asset.id}/image"

    return asset_schema

@router.delete("/{asset_id}")
async def delete_design_asset(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_design_delete)
):
    if is_super_admin(current_user.role):
        result = await db.execute(
            select(models.DesignAsset).where(models.DesignAsset.id == asset_id)
        )
    else:
        result = await db.execute(
            select(models.DesignAsset)
            .where(
                (models.DesignAsset.id == asset_id)
                & visible_user_filter(current_user, models.DesignAsset.user_id)
            )
        )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Design asset not found")

    # Keep scheduled-post history while allowing design deletion.
    scheduled_refs = await db.execute(
        select(models.ScheduledPost).where(models.ScheduledPost.design_asset_id == asset.id)
    )
    for scheduled_post in scheduled_refs.scalars().all():
        scheduled_post.design_asset_id = None

    await db.delete(asset)
    await db.commit()
    return {"message": "Design asset deleted successfully"}
