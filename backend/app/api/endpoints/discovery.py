"""
Creator discovery endpoints powered by influencers.club API.
Enables searching, enriching, and managing creator profiles across platforms.
"""

import logging
import os
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, File, UploadFile, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

# Legacy imports (kept for backward compatibility)
from app.schemas.schemas import InfluencerProfile, DiscoveryRequest
from app.services.discovery_service import DiscoveryService
from app.core.database import get_db
from app.models.models import User
from app.api.deps import require_discovery_read, require_permission

# New influencers.club integration
# TODO: Fix tenacity import issue
# from app.integrations.influencers_club import get_influencers_client, InfluencersClubClient
# TODO: Import creator models once they're fixed
# from app.models.creators import Influencer, InfluencerSocialProfile, InfluencerEnrichmentLog
# from app.schemas.creators import (
#     CreatorDiscoveryRequest,
#     CreatorSearchRequest,
#     CreatorEnrichmentRequest,
#     DiscoverySearchResponse,
#     EnrichmentResponse,
#     CreatorDetailResponse,
#     CreatorListResponse,
#     CreatorStatsResponse,
#     CreditsResponse,
# )

logger = logging.getLogger(__name__)

router = APIRouter()

# TODO: Re-enable after fixing influencers.club integration
# Get API key from environment
# INFLUENCERS_CLUB_API_KEY = os.getenv("INFLUENCERS_CLUB_API_KEY")
# if not INFLUENCERS_CLUB_API_KEY:
#     logger.warning("INFLUENCERS_CLUB_API_KEY environment variable not set")
#
#
# async def get_ic_client() -> InfluencersClubClient:
#     """Dependency: Get the Influencers Club API client."""
#     if not INFLUENCERS_CLUB_API_KEY:
#         raise HTTPException(
#             status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
#             detail="Creator discovery service not configured. Missing API key.",
#         )
#     return await get_influencers_client(INFLUENCERS_CLUB_API_KEY)


# ============================================================================
# LEGACY ENDPOINTS (Backward compatibility)
# ============================================================================

@router.post("/search", response_model=List[InfluencerProfile])
async def search_influencers(
    request: DiscoveryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_discovery_read)
):
    """
    Search for influencers based on text query and filters.
    Priority: Database -> Modash API -> Mock data
    
    **DEPRECATED:** Use `/creators/search-keyword` for real influencer data.
    """
    try:
        profiles = await DiscoveryService.search_influencers(request.query, request.filters, db)
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/image-search", response_model=List[InfluencerProfile])
async def search_by_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_discovery_read)
):
    """
    Search for influencers matching the visual style of an uploaded image.
    
    **DEPRECATED:** This endpoint will be enhanced with real image-to-influencer matching.
    """
    try:
        profiles = await DiscoveryService.search_by_image(file.filename, db)
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/influencers/{handle}", response_model=InfluencerProfile)
async def get_influencer_profile(
    handle: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_discovery_read)
):
    """
    Get detailed profile for a specific influencer.
    Priority: Database -> Modash API -> Mock data
    
    **DEPRECATED:** Use `/creators/{creator_id}` for enriched profile data.
    """
    try:
        profile = await DiscoveryService.get_profile(handle, db)
        if not profile:
            raise HTTPException(status_code=404, detail="Influencer not found")
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# NEW INFLUENCERS.CLUB ENDPOINTS - DISABLED
# ============================================================================
# TODO: Re-enable after resolving model conflicts with Creator table
# Endpoints: /creators/search, /creators/search-keyword, /creators/enrich, /credits
# Issue: Multiple model definitions, circular imports, schema conflicts
#


# ============================================================================
# HELPER FUNCTIONS - DISABLED
# ============================================================================
# TODO: Re-enable after resolving Influencer model conflicts
# Functions: _save_discovered_creator, _save_enriched_creator, _log_enrichment
#


