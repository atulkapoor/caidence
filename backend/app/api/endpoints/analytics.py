from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.models import Campaign, Influencer, CampaignEvent, CampaignInfluencer

router = APIRouter()

class AnalyticsOverview(BaseModel):
    total_reach: int
    engagement_rate: float
    conversions: int
    roi: float

class AnalyticsDashboardResponse(BaseModel):
    overview: AnalyticsOverview
    traffic_data: List[Dict[str, Any]]
    device_data: List[Dict[str, Any]]

@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
async def get_analytics_dashboard(db: AsyncSession = Depends(get_db)):
    """
    Returns aggregated analytics for the Analytics Suite.
    Aggregates real data from Database where possible, falls back to simulation for timeline data.
    """
    # 1. Real Counts from DB
    
    # Active Campaigns
    active_campaigns_count = await db.scalar(
        select(func.count(Campaign.id)).where(Campaign.status == "active")
    ) or 0

    # Total Influencers Linked
    total_influencers = await db.scalar(
        select(func.count(Influencer.id))
    ) or 0
    
    # Total Events (simulating conversions)
    total_events = await db.scalar(
        select(func.count(CampaignEvent.id))
    ) or 0
    
    # Calculate Total Reach (Sum of followers of all influencers)
    # real_reach = await db.scalar(select(func.sum(Influencer.followers))) or 0
    # For demo stability, let's mix real + base
    real_reach_result = await db.execute(select(func.sum(Influencer.followers)))
    real_reach = real_reach_result.scalar() or 0
    
    # If database is empty, provide baseline for demo look & feel
    display_reach = real_reach if real_reach > 0 else 1250000 
    
    # Calculate Avg Engagement
    # This is tricky as engagement is string in DB currently ("4.5%"), need to fix or cast.
    # We will just simulate based on Influencers count for now to avoid SQL casting errors in demo.
    avg_engagement = round(random.uniform(3.5, 5.8), 2)

    # Conversions could be specific events
    # For now, let's say every 10th event is a conversion + baseline
    conversions = int(total_events / 10) + 842

    overview = AnalyticsOverview(
        total_reach=display_reach,
        engagement_rate=avg_engagement,
        conversions=conversions,
        roi=3.2 + (active_campaigns_count * 0.1) # Dynamic ROI based on activity
    )

    # 2. Simulated Timeline Data (Hard to have real historical data in fresh install)
    traffic_data = [
        {"name": "Jan", "value": 3000},
        {"name": "Feb", "value": 4500},
        {"name": "Mar", "value": 3500},
        {"name": "Apr", "value": 6000},
        {"name": "May", "value": 5500},
        {"name": "Jun", "value": 7500},
        {"name": "Jul", "value": 5000},
        {"name": "Aug", "value": 6500},
        {"name": "Sep", "value": 8000},
        {"name": "Oct", "value": 7000},
        {"name": "Nov", "value": 9000},
        {"name": "Dec", "value": 8500},
    ]

    # 3. Simulated Device Data
    device_data = [
        {"name": 'Mobile', "value": 45, "color": '#8b5cf6'},
        {"name": 'Desktop', "value": 35, "color": '#6366f1'},
        {"name": 'Tablet', "value": 20, "color": '#10b981'},
    ]
    
    return AnalyticsDashboardResponse(
        overview=overview,
        traffic_data=traffic_data,
        device_data=device_data
    )

class OverlapRequest(BaseModel):
    channels: List[str]

class OverlapResponse(BaseModel):
    total_reach: int
    unique_reach: int
    overlap_percentage: float
    channel_breakdown: List[Dict[str, Any]]
    message: str

@router.post("/audience-overlap", response_model=OverlapResponse)
async def calculate_audience_overlap(request: OverlapRequest):
    """
    Simulates audience overlap calculation for selected channels.
    """
    if not request.channels:
         raise HTTPException(status_code=400, detail="No channels provided")

    # Mock data generation
    base_reach = {
        "Instagram": 500000,
        "TikTok": 800000,
        "YouTube": 1200000,
        "LinkedIn": 300000,
        "Twitter": 250000,
        "Facebook": 900000,
        "Email": 150000
    }
    
    total_raw_reach = 0
    breakdown = []
    
    for channel in request.channels:
        # Get reach or default to 100k if unknown
        reach = base_reach.get(channel, 100000)
        # Add some random variance
        reach = int(reach * random.uniform(0.9, 1.1))
        
        total_raw_reach += reach
        breakdown.append({
            "channel": channel,
            "reach": reach,
            "color": get_channel_color(channel)
        })

    # Simulate overlap increasing with more channels
    num_channels = len(request.channels)
    if num_channels <= 1:
        overlap_factor = 0.0
    else:
        # 10-30% overlap per additional channel, capped at 60%
        overlap_factor = min(0.15 * (num_channels - 1), 0.60)
        # Add randomness
        overlap_factor *= random.uniform(0.8, 1.2)
    
    unique_reach = int(total_raw_reach * (1 - overlap_factor))
    overlap_percentage = round(overlap_factor * 100, 1)

    return OverlapResponse(
        total_reach=total_raw_reach,
        unique_reach=unique_reach,
        overlap_percentage=overlap_percentage,
        channel_breakdown=breakdown,
        message=f"Estimated {overlap_percentage}% audience overlap across {num_channels} channels."
    )

def get_channel_color(channel: str) -> str:
    colors = {
        "Instagram": "#E1306C",
        "TikTok": "#000000",
        "YouTube": "#FF0000",
        "LinkedIn": "#0077B5",
        "Twitter": "#1DA1F2",
        "Facebook": "#1877F2",
        "Email": "#FFA500"
    }
    return colors.get(channel, "#888888")

class CredibilityRequest(BaseModel):
    handle: str
    platform: str

class CredibilityResponse(BaseModel):
    handle: str
    platform: str
    credibility_score: int
    fake_follower_percentage: float
    is_verified: bool
    risk_level: str # Low, Medium, High

@router.post("/influencer-credibility", response_model=CredibilityResponse)
async def calculate_credibility(request: CredibilityRequest):
    """
    Simulates bot detection and audience quality scoring.
    """
    # Deterministic mock based on handle length to be consistent
    seed = len(request.handle)
    random.seed(seed)
    
    score = random.randint(40, 98)
    fake_followers = round(random.uniform(2.5, 35.0), 1)
    is_verified = random.choice([True, False])
    
    if score > 80:
        risk = "Low"
    elif score > 60:
        risk = "Medium"
    else:
        risk = "High"

    return CredibilityResponse(
        handle=request.handle,
        platform=request.platform,
        credibility_score=score,
        fake_follower_percentage=fake_followers,
        is_verified=is_verified,
        risk_level=risk
    )


class CompetitorRequest(BaseModel):
    competitors: List[str]

@router.post("/competitor-analysis")
async def analyze_competitors(request: CompetitorRequest):
    """
    Simulates finding competitor content and share of voice.
    """
    random.seed(len(request.competitors) + 1)
    
    results = []
    total_sov = 0
    
    for comp in request.competitors:
        sov = random.randint(10, 30)
        total_sov += sov
        
        results.append({
            "name": comp,
            "share_of_voice": sov,
            "sentiment": random.choice(["Positive", "Neutral", "Negative"]),
            "top_hashtags": random.sample(["#innovation", "#tech", "#fail", "#growth", "#marketing", "#leader"], 3),
            "recent_activity": f"{random.randint(2, 15)} posts in last 24h"
        })
        
    # Add "Others" to close the loop to 100% (or close to it)
    if total_sov < 100:
        results.append({
            "name": "Others / Market",
            "share_of_voice": 100 - total_sov,
            "sentiment": "Neutral",
            "top_hashtags": ["#general", "#industry"],
            "recent_activity": "N/A"
        })
    
    return {"breakdown": results}
