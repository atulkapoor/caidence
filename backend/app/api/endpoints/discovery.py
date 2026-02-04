from fastapi import APIRouter, HTTPException, File, UploadFile, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.schemas import InfluencerProfile, DiscoveryRequest
from app.services.discovery_service import DiscoveryService
from app.core.database import get_db

router = APIRouter()

@router.post("/search", response_model=List[InfluencerProfile])
async def search_influencers(request: DiscoveryRequest, db: AsyncSession = Depends(get_db)):
    """
    Search for influencers based on text query and filters.
    Priority: Database -> Modash API -> Mock data
    """
    try:
        profiles = await DiscoveryService.search_influencers(request.query, request.filters, db)
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/image-search", response_model=List[InfluencerProfile])
async def search_by_image(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Search for influencers matching the visual style of an uploaded image.
    """
    try:
        profiles = await DiscoveryService.search_by_image(file.filename, db)
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/influencers/{handle}", response_model=InfluencerProfile)
async def get_influencer_profile(handle: str, db: AsyncSession = Depends(get_db)):
    """
    Get detailed profile for a specific influencer.
    Priority: Database -> Modash API -> Mock data
    """
    try:
        profile = await DiscoveryService.get_profile(handle, db)
        if not profile:
            raise HTTPException(status_code=404, detail="Influencer not found")
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

