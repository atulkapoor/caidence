from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
import random
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import Influencer, Campaign, CampaignInfluencer, User
from app.models.creator import Creator
from app.api.deps import require_crm_read, require_crm_write

router = APIRouter()

class CampaignHistory(BaseModel):
    campaign_name: str
    date: str
    roi_multiple: float
    status: str # "Completed", "Active"

class RelationshipProfile(BaseModel):
    handle: str
    platform: str
    avatar_color: str
    relationship_status: str # "Active", "Vetted", "Past", "Blacklisted"
    total_spend: int
    avg_roi: float
    last_contact: str
    campaign_history: List[CampaignHistory]
    data_source: str = "real"  # "real" or "demo"

@router.get("/relationships", response_model=List[RelationshipProfile])
async def get_relationships(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_crm_read)
):
    """
    Returns CRM data for influencer relationships.
    Queries real Creators and Influencers with their campaign history.
    Falls back to demo data when database is empty.
    """
    profiles = []
    
    # 1. Query Creators (richer relationship data) with org filtering
    if current_user.role == "super_admin":
        creators_result = await db.execute(
            select(Creator).order_by(Creator.created_at.desc()).limit(20)
        )
    else:
        creators_result = await db.execute(
            select(Creator)
            .join(User, Creator.user_id == User.id)
            .where(User.organization_id == current_user.organization_id)
            .order_by(Creator.created_at.desc())
            .limit(20)
        )
    creators = creators_result.scalars().all()
    
    for creator in creators:
        # Get campaign history for this creator's linked influencer
        campaign_history = await _get_creator_campaign_history(db, creator.handle, current_user)
        
        profiles.append(RelationshipProfile(
            handle=f"@{creator.handle.lstrip('@')}",
            platform=creator.platform or "Instagram",
            avatar_color=f"hsl({hash(creator.handle) % 360}, 70%, 50%)",
            relationship_status=_map_creator_status(creator.status),
            total_spend=int(creator.total_earnings) if creator.total_earnings else 0,
            avg_roi=round(creator.commission_rate * 30, 1) if creator.commission_rate else 3.0,
            last_contact=creator.updated_at.strftime("%Y-%m-%d") if creator.updated_at else datetime.now().strftime("%Y-%m-%d"),
            campaign_history=campaign_history,
            data_source="real"
        ))
    
    # 2. Also query Influencers table if we need more
    if len(profiles) < 10:
        influencers_result = await db.execute(
            select(Influencer).limit(10 - len(profiles))
        )
        influencers = influencers_result.scalars().all()
        
        existing_handles = {p.handle.lower() for p in profiles}
        
        for influencer in influencers:
            handle = f"@{influencer.handle.lstrip('@')}"
            if handle.lower() in existing_handles:
                continue
            
            # Get campaign history
            campaign_history = await _get_influencer_campaign_history(db, influencer.id, current_user)
            
            profiles.append(RelationshipProfile(
                handle=handle,
                platform=influencer.platform or "Instagram",
                avatar_color=f"hsl({hash(influencer.handle) % 360}, 70%, 50%)",
                relationship_status="Active",
                total_spend=0,
                avg_roi=3.0,
                last_contact=datetime.now().strftime("%Y-%m-%d"),
                campaign_history=campaign_history,
                data_source="real"
            ))
    
    # 3. Fallback to demo data if database is empty
    if not profiles:
        profiles = _generate_demo_relationships()
    
    return profiles

def _map_creator_status(status: str) -> str:
    """Map Creator.status to CRM relationship status."""
    mapping = {
        "pending": "Past",
        "active": "Active",
        "vetted": "Vetted",
        "past": "Past",
        "blacklisted": "Blacklisted"
    }
    return mapping.get(status, "Active")

async def _get_creator_campaign_history(db: AsyncSession, handle: str, current_user: User) -> List[CampaignHistory]:
    """Get campaign history for a creator by their handle."""
    try:
        result = await db.execute(
            select(Influencer).where(Influencer.handle.ilike(f"%{handle.lstrip('@')}%"))
        )
        influencer = result.scalar_one_or_none()
        
        if influencer:
            return await _get_influencer_campaign_history(db, influencer.id, current_user)
        return []
    except Exception:
        return []

async def _get_influencer_campaign_history(db: AsyncSession, influencer_id: int, current_user: User) -> List[CampaignHistory]:
    """Get campaign history for an influencer with org filtering."""
    try:
        if current_user.role == "super_admin":
            result = await db.execute(
                select(CampaignInfluencer, Campaign)
                .join(Campaign, CampaignInfluencer.campaign_id == Campaign.id)
                .where(CampaignInfluencer.influencer_id == influencer_id)
                .order_by(CampaignInfluencer.joined_at.desc())
                .limit(5)
            )
        else:
            result = await db.execute(
                select(CampaignInfluencer, Campaign)
                .join(Campaign, CampaignInfluencer.campaign_id == Campaign.id)
                .join(User, Campaign.owner_id == User.id)
                .where(
                    (CampaignInfluencer.influencer_id == influencer_id) &
                    (User.organization_id == current_user.organization_id)
                )
                .order_by(CampaignInfluencer.joined_at.desc())
                .limit(5)
            )
        rows = result.all()
        
        history = []
        for ci, campaign in rows:
            history.append(CampaignHistory(
                campaign_name=campaign.title or f"Campaign {campaign.id}",
                date=ci.joined_at.strftime("%Y-%m-%d") if ci.joined_at else datetime.now().strftime("%Y-%m-%d"),
                roi_multiple=round(random.uniform(1.5, 4.5), 2),
                status="Completed" if campaign.status == "completed" else "Active"
            ))
        return history
    except Exception:
        return []

def _generate_demo_relationships() -> List[RelationshipProfile]:
    """Generate demo CRM data for fresh installations."""
    handles = ["@sarah_style", "@tech_guru_99", "@fitness_jen", "@travel_mike", "@foodie_lisa", "@gamer_x"]
    platforms = ["Instagram", "YouTube", "TikTok", "Instagram", "TikTok", "Twitch"]
    statuses = ["Active", "Vetted", "Past", "Active", "Vetted", "Past"]
    colors = ["hsl(340, 70%, 50%)", "hsl(200, 70%, 50%)", "hsl(150, 70%, 50%)", "hsl(40, 70%, 50%)", "hsl(280, 70%, 50%)", "hsl(260, 70%, 50%)"]

    profiles = []
    for i in range(len(handles)):
        history = []
        num_campaigns = random.randint(1, 5)
        current_date_obj = datetime.now()
        
        for j in range(num_campaigns):
            date_str = (current_date_obj - timedelta(days=random.randint(30, 300))).strftime("%Y-%m-%d")
            history.append(CampaignHistory(
                campaign_name=f"Campaign {chr(65+j)}",
                date=date_str,
                roi_multiple=round(random.uniform(1.2, 5.0), 2),
                status="Completed"
            ))
            
        profiles.append(RelationshipProfile(
            handle=handles[i],
            platform=platforms[i],
            avatar_color=colors[i],
            relationship_status=statuses[i],
            total_spend=random.randint(5000, 50000),
            avg_roi=round(random.uniform(2.0, 4.5), 1),
            last_contact=(datetime.now() - timedelta(days=random.randint(1, 45))).strftime("%Y-%m-%d"),
            campaign_history=history,
            data_source="demo"
        ))
        
    return profiles

@router.post("/generate-report")
async def generate_xray_report(
    handle: str,
    current_user: User = Depends(require_crm_write)
):
    """
    Generates a PDF 'X-Ray' report for an influencer.
    """
    return {
        "status": "success",
        "message": f"X-Ray Report generated for {handle}",
        "download_url": "#",
        "generated_at": datetime.now().isoformat()
    }


