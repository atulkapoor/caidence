from fastapi import APIRouter, HTTPException, File, UploadFile
from typing import List
from app.schemas.schemas import InfluencerProfile, DiscoveryRequest
from app.services.discovery_service import DiscoveryService

router = APIRouter()

@router.post("/search", response_model=List[InfluencerProfile])
async def search_influencers(request: DiscoveryRequest):
    """
    Search for influencers based on text query and filters.
    """
    try:
        profiles = await DiscoveryService.search_influencers(request.query, request.filters)
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/image-search", response_model=List[InfluencerProfile])
async def search_by_image(file: UploadFile = File(...)):
    """
    Search for influencers matching the visual style of an uploaded image.
    """
    try:
        profiles = await DiscoveryService.search_by_image(file.filename)
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
