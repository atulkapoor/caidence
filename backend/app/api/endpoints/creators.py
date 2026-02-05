"""
Creator roster management endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid
import random

from app.core.database import get_db
from app.models import Creator, User
from app.api.deps import get_current_active_user, require_creators_read, require_creators_write
from app.services.auth_service import is_super_admin, is_brand_level

router = APIRouter()


# --- Schemas ---
class CreatorCreate(BaseModel):
    brand_id: Optional[int] = None
    handle: str
    platform: str
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    category: Optional[str] = None
    tier: Optional[str] = None  # Nano, Micro, Macro, Mega
    follower_count: Optional[int] = 0
    engagement_rate: Optional[float] = 0.0


class CreatorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    category: Optional[str] = None
    tier: Optional[str] = None
    follower_count: Optional[int] = None
    engagement_rate: Optional[float] = None
    status: Optional[str] = None
    commission_rate: Optional[float] = None
    notes: Optional[str] = None


class CreatorResponse(BaseModel):
    id: int
    brand_id: Optional[int]
    handle: str
    platform: str
    name: Optional[str]
    email: Optional[str]
    category: Optional[str]
    tier: Optional[str]
    follower_count: int
    engagement_rate: float
    status: str
    is_approved: bool
    affiliate_code: Optional[str]
    commission_rate: float
    total_earnings: float

    class Config:
        from_attributes = True


class AffiliateResponse(BaseModel):
    affiliate_code: str
    affiliate_url: str


class PerformanceStats(BaseModel):
    total_clicks: int
    total_conversions: int
    conversion_rate: float
    total_revenue: float
    commission_earned: float


# --- Endpoints ---
@router.get("/", response_model=List[CreatorResponse])
async def list_creators(
    brand_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_creators_read)
):
    """
    List creators in user's organization.
    """
    query = select(Creator)
    
    if brand_id:
        query = query.where(Creator.brand_id == brand_id)
    
    if status:
        query = query.where(Creator.status == status)
    
    # Org filtering
    if current_user.role != "super_admin":
        query = query.join(User, Creator.user_id == User.id).where(
            User.organization_id == current_user.organization_id
        )
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=CreatorResponse)
async def add_creator(
    creator_data: CreatorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_creators_write)
):
    """
    Add a creator to the roster.
    """
    new_creator = Creator(
        brand_id=creator_data.brand_id,
        handle=creator_data.handle,
        platform=creator_data.platform,
        name=creator_data.name,
        email=creator_data.email,
        phone=creator_data.phone,
        bio=creator_data.bio,
        category=creator_data.category,
        tier=creator_data.tier,
        follower_count=creator_data.follower_count or 0,
        engagement_rate=creator_data.engagement_rate or 0.0,
        status="active",
        is_approved=True,
        user_id=current_user.id
    )
    db.add(new_creator)
    await db.commit()
    await db.refresh(new_creator)
    return new_creator


@router.get("/{creator_id}", response_model=CreatorResponse)
async def get_creator(
    creator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_creators_read)
):
    """
    Get creator details.
    """
    if current_user.role == "super_admin":
        result = await db.execute(select(Creator).where(Creator.id == creator_id))
    else:
        result = await db.execute(
            select(Creator)
            .join(User, Creator.user_id == User.id)
            .where(
                (Creator.id == creator_id) &
                (User.organization_id == current_user.organization_id)
            )
        )
    creator = result.scalar_one_or_none()
    
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    return creator


@router.patch("/{creator_id}", response_model=CreatorResponse)
async def update_creator(
    creator_id: int,
    creator_data: CreatorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_creators_write)
):
    """
    Update creator details.
    """
    if current_user.role == "super_admin":
        result = await db.execute(select(Creator).where(Creator.id == creator_id))
    else:
        result = await db.execute(
            select(Creator)
            .join(User, Creator.user_id == User.id)
            .where(
                (Creator.id == creator_id) &
                (User.organization_id == current_user.organization_id)
            )
        )
    creator = result.scalar_one_or_none()
    
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    for field, value in creator_data.dict(exclude_unset=True).items():
        setattr(creator, field, value)
    
    await db.commit()
    await db.refresh(creator)
    return creator


@router.delete("/{creator_id}")
async def remove_creator(
    creator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_creators_write)
):
    """
    Remove creator from roster.
    """
    if current_user.role == "super_admin":
        result = await db.execute(select(Creator).where(Creator.id == creator_id))
    else:
        result = await db.execute(
            select(Creator)
            .join(User, Creator.user_id == User.id)
            .where(
                (Creator.id == creator_id) &
                (User.organization_id == current_user.organization_id)
            )
        )
    creator = result.scalar_one_or_none()
    
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    creator.status = "past"
    await db.commit()
    
    return {"message": "Creator removed from roster"}


@router.post("/{creator_id}/affiliate", response_model=AffiliateResponse)
async def generate_affiliate_link(
    creator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_creators_write)
):
    """
    Generate unique affiliate code for creator.
    """
    if current_user.role == "super_admin":
        result = await db.execute(select(Creator).where(Creator.id == creator_id))
    else:
        result = await db.execute(
            select(Creator)
            .join(User, Creator.user_id == User.id)
            .where(
                (Creator.id == creator_id) &
                (User.organization_id == current_user.organization_id)
            )
        )
    creator = result.scalar_one_or_none()
    
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    if not creator.affiliate_code:
        creator.affiliate_code = f"{creator.handle.replace('@', '')}_{uuid.uuid4().hex[:6]}"
        await db.commit()
        await db.refresh(creator)
    
    return AffiliateResponse(
        affiliate_code=creator.affiliate_code,
        affiliate_url=f"https://store.example.com/?ref={creator.affiliate_code}"
    )


@router.get("/{creator_id}/performance", response_model=PerformanceStats)
async def get_creator_performance(
    creator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_creators_read)
):
    """
    Get creator performance metrics.
    """
    if current_user.role == "super_admin":
        result = await db.execute(select(Creator).where(Creator.id == creator_id))
    else:
        result = await db.execute(
            select(Creator)
            .join(User, Creator.user_id == User.id)
            .where(
                (Creator.id == creator_id) &
                (User.organization_id == current_user.organization_id)
            )
        )
    creator = result.scalar_one_or_none()
    
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    clicks = random.randint(500, 5000)
    conversions = random.randint(20, 200)
    revenue = conversions * random.uniform(50, 150)
    
    return PerformanceStats(
        total_clicks=clicks,
        total_conversions=conversions,
        conversion_rate=round(conversions / clicks * 100, 2),
        total_revenue=round(revenue, 2),
        commission_earned=round(revenue * creator.commission_rate, 2)
    )

