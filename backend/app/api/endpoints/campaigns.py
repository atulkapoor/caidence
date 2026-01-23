from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Campaign
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# --- Schemas ---
class CampaignBase(BaseModel):
    title: str
    status: str = "draft"

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(CampaignBase):
    pass

class CampaignResponse(CampaignBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    owner_id: Optional[int] = None
    
    # Mock fields that aren't in DB yet but needed for UI
    description: str = "No description"
    progress: int = 0
    budget: str = "$0"
    spent: str = "$0"
    channels: List[str] = []
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/", response_model=List[CampaignResponse])
async def read_campaigns(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).offset(skip).limit(limit))
    campaigns = result.scalars().all()
    
    # Map to schema - in a real app these fields would be in DB
    # For now we use the model defaults + mock data for UI-only fields
    results = []
    for c in campaigns:
        # Create a transient copy or dictionary to attach mock data
        # Since 'campaigns' are ORM objects, we can't easily attach arbitrary attrs that aren't in model
        # So we convert to dict or rely on Pydantic's from_orm with some glue.
        # Simplest way for this mock stage:
        c_dict = vars(c) # get dict items
        # cleanup sqlalchemy internal state
        if "_sa_instance_state" in c_dict:
            del c_dict["_sa_instance_state"]
        
        # Add mock dates if missing
        start = c.created_at
        # End date 30 days later
        end = datetime.fromtimestamp(c.created_at.timestamp() + 30 * 24 * 3600)
        
        c_dict["start_date"] = start
        c_dict["end_date"] = end
        c_dict["channels"] = ["Social", "Email"]
        c_dict["budget"] = "$5,000"
        
        results.append(CampaignResponse(**c_dict))
        
    return results

@router.post("/", response_model=CampaignResponse)
async def create_campaign(campaign: CampaignCreate, db: AsyncSession = Depends(get_db)):
    # Hardcode owner_id=1 for now (Demo User)
    db_campaign = Campaign(**campaign.dict(), owner_id=1) 
    db.add(db_campaign)
    await db.commit()
    await db.refresh(db_campaign)
    return db_campaign

@router.get("/{campaign_id}", response_model=CampaignResponse)
async def read_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(campaign_id: int, campaign: CampaignUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    db_campaign = result.scalar_one_or_none()
    if db_campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    for key, value in campaign.dict().items():
        setattr(db_campaign, key, value)
    
    await db.commit()
    await db.refresh(db_campaign)
    return db_campaign

    await db.delete(db_campaign)
    await db.commit()
    return {"ok": True}

@router.get("/analytics/stats")
async def get_campaign_analytics():
    """
    Returns aggregated analytics for the campaign dashboard.
    In a real app, this would aggregate data from an Events/Metrics table.
    """
    return {
        "overview": {
            "total_spend": "$12,450",
            "roi": "320%",
            "conversions": "845",
            "ctr": "2.8%"
        },
        "performance_chart": [
            {"name": "Jan", "value": 400},
            {"name": "Feb", "value": 300},
            {"name": "Mar", "value": 600},
            {"name": "Apr", "value": 800},
            {"name": "May", "value": 700},
            {"name": "Jun", "value": 900}
        ],
        "channel_distribution": [
            {"name": "Social", "value": 45},
            {"name": "Email", "value": 25},
            {"name": "Search", "value": 20},
            {"name": "Display", "value": 10}
        ]
    }
