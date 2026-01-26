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
from app.schemas import schemas

# Fallback Update schema if not in global
class CampaignUpdate(schemas.CampaignBase):
    pass

# --- Endpoints ---

@router.get("/", response_model=List[schemas.Campaign])
async def read_campaigns(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).order_by(Campaign.created_at.desc()).offset(skip).limit(limit))
    campaigns = result.scalars().all()
    return campaigns

@router.post("/", response_model=schemas.Campaign)
async def create_campaign(campaign: schemas.CampaignCreate, db: AsyncSession = Depends(get_db)):
    # Hardcode owner_id=1 for now (Demo User)
    db_campaign = Campaign(**campaign.dict(), owner_id=1) 
    db.add(db_campaign)
    await db.commit()
    await db.refresh(db_campaign)
    return db_campaign

@router.get("/{campaign_id}", response_model=schemas.Campaign)
async def read_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.put("/{campaign_id}", response_model=schemas.Campaign)
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
