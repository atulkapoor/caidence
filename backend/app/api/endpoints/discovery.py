from fastapi import APIRouter, HTTPException, File, UploadFile
from typing import List, Optional
from pydantic import BaseModel
import random

router = APIRouter()

class DiscoveryFilter(BaseModel):
    category: Optional[str] = None
    min_reach: Optional[int] = 0
    min_engagement: Optional[float] = 0.0
    location: Optional[str] = None

class DiscoveryRequest(BaseModel):
    query: str
    filters: Optional[DiscoveryFilter] = None

class InfluencerProfile(BaseModel):
    handle: str
    platform: str
    avatar_color: str
    followers: int
    engagement_rate: float
    content_style_match: List[str] # e.g. "High Energy", "Minimalist"
    voice_analysis: List[str] # e.g. "Authoritative", "Relatable"
    image_recognition_tags: List[str] # e.g. "Outdoors", "Tech"
    audience_demographics: str
    match_score: int # 0-100

@router.post("/search", response_model=List[InfluencerProfile])
async def search_influencers(request: DiscoveryRequest):
    """
    Simulates AI-powered search by matching 'content vibes' and voice.
    """
    # Deterministic seed for consistency
    random.seed(len(request.query) + (request.filters.min_reach if request.filters else 0))

    profiles = []
    # Generate 6-10 mock results
    num_results = random.randint(6, 12)
    
    platforms = ["Instagram", "TikTok", "YouTube", "LinkedIn"]
    styles = ["High Energy", "Minimalist", "Educational", "Cinematic", "Raw/Vlog", "Professional"]
    voices = ["Authoritative", "Relatable", "Fast-paced", "Humorous", "Inspirational", "Analytic"]
    tags_pool = ["Outdoors", "Luxury", "Tech Gadgets", "Fashion", "Food", "Travel", "Fitness", "Decor"]
    
    for i in range(num_results):
        base_handle = request.query.split(" ")[0] if request.query else "creator"
        handle = f"@{base_handle}_{random.randint(100, 999)}"
        
        # Mock logic to generate "AI Analysis" tags
        profile_tags = random.sample(tags_pool, 3)
        profile_style = random.sample(styles, 2)
        profile_voice = random.sample(voices, 2)
        
        profiles.append(InfluencerProfile(
            handle=handle,
            platform=random.choice(platforms),
            avatar_color=f"hsl({random.randint(0, 360)}, 70%, 50%)",
            followers=random.randint(10000, 5000000),
            engagement_rate=round(random.uniform(1.5, 12.0), 1),
            content_style_match=profile_style,
            voice_analysis=profile_voice,
            image_recognition_tags=profile_tags,
            audience_demographics=f"{random.choice(['18-24', '25-34', '35-44'])}, {random.choice(['Female', 'Male', 'Mixed'])}",
            match_score=random.randint(75, 99)
        ))
    
    # Sort by match score
    profiles.sort(key=lambda x: x.match_score, reverse=True)
    return profiles

@router.post("/image-search", response_model=List[InfluencerProfile])
async def search_by_image(file: UploadFile = File(...)):
    """
    Simulates finding influencers matching the visual style of an uploaded image.
    """
    # Just return random results similar to text search for now
    # In a real app, this would process the image
    
    random.seed(file.filename) # Seed based on filename
    
    profiles = []
    num_results = 5
    
    platforms = ["Instagram", "Pinterest", "TikTok"]
    styles = ["Aesthetic", "Visual", "Cinematic"]
    tags_pool = ["Visual Match", "Color Palette Match", "Object Match"]

    for i in range(num_results):
        handle = f"@visual_creator_{random.randint(100, 999)}"
        
        profiles.append(InfluencerProfile(
            handle=handle,
            platform=random.choice(platforms),
            avatar_color=f"hsl({random.randint(0, 360)}, 70%, 50%)",
            followers=random.randint(50000, 1000000),
            engagement_rate=round(random.uniform(3.0, 15.0), 1),
            content_style_match=random.sample(styles, 2),
            voice_analysis=["Visual Storytelling"],
            image_recognition_tags=tags_pool,
            audience_demographics="25-34, Mixed",
            match_score=random.randint(85, 98)
        ))
        
    return profiles
