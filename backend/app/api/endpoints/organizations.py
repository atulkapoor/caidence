"""
Organization management endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models import Organization, User
from app.schemas import schemas
from app.api.endpoints.auth import get_current_active_user
from app.services.auth_service import is_super_admin, is_agency_level

router = APIRouter()


# --- Schemas ---
class OrganizationCreate(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    plan_tier: Optional[str] = "free"


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    plan_tier: Optional[str] = None
    is_active: Optional[bool] = None


class OrganizationResponse(BaseModel):
    id: int
    name: str
    slug: str
    logo_url: Optional[str]
    plan_tier: str
    is_active: bool

    class Config:
        from_attributes = True


class UsageStats(BaseModel):
    total_brands: int
    total_users: int
    total_campaigns: int
    storage_used_mb: float


# --- Endpoints ---
@router.get("/", response_model=List[OrganizationResponse])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List organizations. Super admin sees all, others see only their org.
    """
    if is_super_admin(current_user.role):
        result = await db.execute(select(Organization))
        return result.scalars().all()
    elif current_user.organization_id:
        result = await db.execute(
            select(Organization).where(Organization.id == current_user.organization_id)
        )
        return result.scalars().all()
    return []


@router.post("/", response_model=OrganizationResponse)
async def create_organization(
    org_data: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new organization. Super admin only.
    """
    if not is_super_admin(current_user.role):
        raise HTTPException(status_code=403, detail="Only super admins can create organizations")
    
    # Check slug uniqueness
    result = await db.execute(select(Organization).where(Organization.slug == org_data.slug))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    new_org = Organization(
        name=org_data.name,
        slug=org_data.slug,
        logo_url=org_data.logo_url,
        plan_tier=org_data.plan_tier,
    )
    db.add(new_org)
    await db.commit()
    await db.refresh(new_org)
    return new_org


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get organization details.
    """
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Permission check
    if not is_super_admin(current_user.role) and current_user.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this organization")
    
    return org


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: int,
    org_data: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update organization settings.
    """
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Only super admin or agency admin of that org can update
    can_update = is_super_admin(current_user.role) or (
        current_user.organization_id == org_id and current_user.role == "agency_admin"
    )
    if not can_update:
        raise HTTPException(status_code=403, detail="Not authorized to update this organization")
    
    if org_data.name is not None:
        org.name = org_data.name
    if org_data.logo_url is not None:
        org.logo_url = org_data.logo_url
    if org_data.plan_tier is not None and is_super_admin(current_user.role):
        org.plan_tier = org_data.plan_tier
    if org_data.is_active is not None and is_super_admin(current_user.role):
        org.is_active = org_data.is_active
    
    await db.commit()
    await db.refresh(org)
    return org


@router.get("/{org_id}/usage", response_model=UsageStats)
async def get_organization_usage(
    org_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get usage statistics for an organization.
    """
    # Mock usage data for now
    return UsageStats(
        total_brands=5,
        total_users=23,
        total_campaigns=47,
        storage_used_mb=256.7
    )
from app.schemas import schemas

@router.get("/{org_id}/users", response_model=List[schemas.UserResponse])
async def list_organization_users(
    org_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List users in an organization.
    """
    # Permission check
    if not is_super_admin(current_user.role) and current_user.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this organization's users")
    
    result = await db.execute(select(User).where(User.organization_id == org_id))
    return result.scalars().all()
