"""
Brand management endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models import Brand, User
from app.api.endpoints.auth import get_current_active_user
from app.services.auth_service import is_super_admin, is_agency_level

router = APIRouter()


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
    if is_super_admin(current_user.role):
        result = await db.execute(select(Brand))
        return result.scalars().all()
    elif current_user.organization_id:
        result = await db.execute(
            select(Brand).where(Brand.organization_id == current_user.organization_id)
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
    if not is_agency_level(current_user.role):
        raise HTTPException(status_code=403, detail="Only agency users can create brands")
    
    # Determine organization_id
    org_id = brand_data.organization_id if is_super_admin(current_user.role) else current_user.organization_id
    
    if not org_id:
        raise HTTPException(status_code=400, detail="organization_id is required")
    
    # Generate slug if not provided
    slug = brand_data.slug or brand_data.name.lower().replace(" ", "-")
    
    new_brand = Brand(
        organization_id=org_id,
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
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Permission check
    if not is_super_admin(current_user.role) and current_user.organization_id != brand.organization_id:
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
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Permission check
    can_update = is_super_admin(current_user.role) or (
        current_user.organization_id == brand.organization_id and 
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
    Soft-delete (deactivate) a brand.
    """
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Only agency admin or super admin can delete
    can_delete = is_super_admin(current_user.role) or (
        current_user.organization_id == brand.organization_id and 
        current_user.role == "agency_admin"
    )
    if not can_delete:
        raise HTTPException(status_code=403, detail="Not authorized to delete this brand")
    
    brand.is_active = False
    await db.commit()
    
    return {"message": "Brand archived successfully"}
