from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models import models
from app.models.models import Campaign, CampaignEvent, Influencer, CampaignInfluencer
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

@router.get("/{campaign_id}", response_model=schemas.CampaignFullResponse)
async def read_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Campaign)
        .options(selectinload(Campaign.influencers), selectinload(Campaign.events))
        .where(Campaign.id == campaign_id)
    )
    campaign = result.scalar_one_or_none()
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.post("/{campaign_id}/launch")
async def launch_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign.status = "active"
    
    # Log Launch Event
    event = CampaignEvent(
        campaign_id=campaign.id,
        type="launch",
        value=0, # No monetary value for launch itself
        metadata_json='{"triggered_by": "user_action"}'
    )
    db.add(event)
    await db.commit()
    return {"status": "launched", "campaign_id": campaign.id}

@router.post("/{campaign_id}/influencers")
async def add_influencer_to_campaign(campaign_id: int, influencer_handle: str, db: AsyncSession = Depends(get_db)):
    # 1. Check Campaign
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # 2. Check/Create Influencer (Simple Logic: If not exists, create stub)
    result = await db.execute(select(Influencer).where(Influencer.handle == influencer_handle))
    influencer = result.scalar_one_or_none()
    
    if not influencer:
        # Create minimal influencer record
        influencer = Influencer(
            handle=influencer_handle,
            platform="Instagram", # Defaulting for now
            followers=0
        )
        db.add(influencer)
        await db.flush() # Get ID
        
    # 3. Create Link
    # Check if already linked
    link_result = await db.execute(select(CampaignInfluencer).where(
        (CampaignInfluencer.campaign_id == campaign.id) & 
        (CampaignInfluencer.influencer_id == influencer.id)
    ))
    if link_result.scalar_one_or_none():
        return {"status": "already_linked"}
        
    link = CampaignInfluencer(campaign_id=campaign.id, influencer_id=influencer.id)
    db.add(link)
    await db.commit()
    
    return {"status": "added", "influencer": influencer.handle}

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
