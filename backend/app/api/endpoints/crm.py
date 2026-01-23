from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import random
from datetime import datetime, timedelta

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

@router.get("/relationships", response_model=List[RelationshipProfile])
async def get_relationships():
    """
    Returns mock CRM data for influencer relationships.
    """
    profiles = []
    
    # Mock data definitions
    handles = ["@sarah_style", "@tech_guru_99", "@fitness_jen", "@travel_mike", "@foodie_lisa", "@gamer_x"]
    platforms = ["Instagram", "YouTube", "TikTok", "Instagram", "TikTok", "Twitch"]
    statuses = ["Active", "Vetted", "Past", "Active", "Vetted", "Past"]
    colors = ["hsl(340, 70%, 50%)", "hsl(200, 70%, 50%)", "hsl(150, 70%, 50%)", "hsl(40, 70%, 50%)", "hsl(280, 70%, 50%)", "hsl(260, 70%, 50%)"]

    for i in range(len(handles)):
        # Generate mock history
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
            campaign_history=history
        ))
        
    return profiles

@router.post("/generate-report")
async def generate_xray_report(handle: str):
    """
    Simulates generating a PDF 'X-Ray' report.
    """
    return {
        "status": "success",
        "message": f"X-Ray Report generated for {handle}",
        "download_url": "#", # Mock URL
        "generated_at": datetime.now().isoformat()
    }
