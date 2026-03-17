"""
Brand management endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, update
import re

from app.core.database import get_db
from app.models import Brand, User, Organization, Creator, SocialConnection, ContentGeneration, ScheduledPost, DesignAsset
from app.api.endpoints.auth import get_current_active_user
from app.services.auth_service import is_super_admin, is_agency_level
from app.services.permission_engine import PermissionEngine

router = APIRouter()

def _slugify(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9\\s-]", "", value or "").strip().lower()
    normalized = re.sub(r"\\s+", "-", normalized)
    return normalized or "organization"

async def _ensure_organization_for_user(
    db: AsyncSession,
    current_user: User,
) -> int:
    if current_user.organization_id:
        return current_user.organization_id

    base_name = (current_user.company or current_user.full_name or "").strip()
    if not base_name:
        base_name = (current_user.email.split("@")[0] if current_user.email else "Organization").strip()
    org_name = base_name or "Organization"
    base_slug = _slugify(org_name)
    slug = base_slug
    suffix = 1
    while True:
        exists = await db.execute(select(Organization).where(Organization.slug == slug))
        if not exists.scalar_one_or_none():
            break
        suffix += 1
        slug = f"{base_slug}-{suffix}"

    new_org = Organization(name=org_name, slug=slug)
    db.add(new_org)
    await db.commit()
    await db.refresh(new_org)

    current_user.organization_id = new_org.id
    await db.commit()
    await db.refresh(current_user)

    return new_org.id


# --- Schemas ---
class BrandCreate(BaseModel):
    name: str
    organization_id: Optional[int] = None  # Required for super admins
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class BrandResponse(BaseModel):
    id: int
    organization_id: int
    created_by_user_id: Optional[int] = None
    created_by_role: Optional[str] = None
    name: str
    slug: Optional[str]
    logo_url: Optional[str]
    industry: Optional[str]
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# --- Endpoints ---
@router.get("", response_model=List[BrandResponse])
async def list_brands(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List brands in user's organization.
    """
    engine = PermissionEngine.from_loaded_user(current_user)
    if not engine.has_permission("agency", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view brands")
    if is_super_admin(current_user.role):
        result = await db.execute(select(Brand))
        return result.scalars().all()
    else:
        result = await db.execute(
            select(Brand).where(
                Brand.created_by_user_id == current_user.id
            )
        )
        return result.scalars().all()
    return []


@router.post("", response_model=BrandResponse)
async def create_brand(
    brand_data: BrandCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new brand within user's organization.
    """
    engine = PermissionEngine.from_loaded_user(current_user)
    if not engine.has_permission("agency", "create"):
        raise HTTPException(status_code=403, detail="Not authorized to create brands")
    if not is_agency_level(current_user.role):
        raise HTTPException(status_code=403, detail="Only agency users can create brands")
    
    # Determine organization_id
    if is_super_admin(current_user.role):
        org_id = brand_data.organization_id or await _ensure_organization_for_user(db, current_user)
    else:
        org_id = await _ensure_organization_for_user(db, current_user)
    
    # Generate slug if not provided
    slug = brand_data.slug or brand_data.name.lower().replace(" ", "-")
    
    new_brand = Brand(
        organization_id=org_id,
        created_by_user_id=current_user.id,
        created_by_role=current_user.role,
        name=brand_data.name,
        slug=slug,
        logo_url=brand_data.logo_url,
        industry=brand_data.industry,
        description=brand_data.description,
    )
    db.add(new_brand)
    await db.commit()
    await db.refresh(new_brand)
    return new_brand


@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get brand details.
    """
    engine = PermissionEngine.from_loaded_user(current_user)
    if not engine.has_permission("agency", "read"):
        raise HTTPException(status_code=403, detail="Not authorized to view this brand")
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Permission check
    if not is_super_admin(current_user.role) and brand.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this brand")
    
    return brand


@router.patch("/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: int,
    brand_data: BrandUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update brand settings.
    """
    engine = PermissionEngine.from_loaded_user(current_user)
    if not engine.has_permission("agency", "update"):
        raise HTTPException(status_code=403, detail="Not authorized to update brands")
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Permission check
    can_update = is_super_admin(current_user.role) or (
        brand.created_by_user_id == current_user.id and 
        current_user.role in ["agency_admin", "brand_admin"]
    )
    if not can_update:
        raise HTTPException(status_code=403, detail="Not authorized to update this brand")
    
    if brand_data.name is not None:
        brand.name = brand_data.name
    if brand_data.logo_url is not None:
        brand.logo_url = brand_data.logo_url
    if brand_data.industry is not None:
        brand.industry = brand_data.industry
    if brand_data.description is not None:
        brand.description = brand_data.description
    if brand_data.is_active is not None:
        brand.is_active = brand_data.is_active
    
    await db.commit()
    await db.refresh(brand)
    return brand


@router.delete("/{brand_id}")
async def delete_brand(
    brand_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Permanently delete a brand.
    """
    engine = PermissionEngine.from_loaded_user(current_user)
    if not engine.has_permission("agency", "delete"):
        raise HTTPException(status_code=403, detail="Not authorized to delete brands")
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Only agency admin or super admin can delete
    can_delete = is_super_admin(current_user.role) or (
        brand.created_by_user_id == current_user.id and 
        current_user.role == "agency_admin"
    )
    if not can_delete:
        raise HTTPException(status_code=403, detail="Not authorized to delete this brand")
    
    await db.execute(
        update(SocialConnection)
        .where(SocialConnection.brand_id == brand_id)
        .values(brand_id=None)
    )
    await db.execute(
        update(Creator)
        .where(Creator.brand_id == brand_id)
        .values(brand_id=None)
    )
    await db.execute(
        update(ContentGeneration)
        .where(ContentGeneration.brand_id == brand_id)
        .values(brand_id=None)
    )
    await db.execute(
        update(ScheduledPost)
        .where(ScheduledPost.brand_id == brand_id)
        .values(brand_id=None)
    )
    await db.execute(
        update(DesignAsset)
        .where(DesignAsset.brand_id == brand_id)
        .values(brand_id=None)
    )

    await db.delete(brand)
    await db.commit()
    
    return {"message": "Brand deleted successfully"}
