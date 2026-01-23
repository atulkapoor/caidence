from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel
import random

router = APIRouter()

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
