"""
FastAPI routes for creator discovery and enrichment.
Endpoints for searching, enriching, and managing creator profiles.
"""

import logging
import os
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import get_db, require_permission
from app.integrations.influencers_club import get_influencers_client, InfluencersClubClient
from app.models.creators import Creator, CreatorSocialProfile, CreatorEnrichmentLog
from app.schemas.creators import (
    CreatorDiscoveryRequest,
    CreatorDiscoveryFilters,
    CreatorEnrichmentRequest,
    CreatorSearchRequest,
    DiscoverySearchResponse,
    EnrichmentResponse,
    CreatorDetailResponse,
    CreatorListResponse,
    CreatorStatsResponse,
    CreditsResponse,
    ErrorResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/discovery", tags=["discovery"])

# Get API key from environment
INFLUENCERS_CLUB_API_KEY = os.getenv("INFLUENCERS_CLUB_API_KEY")
if not INFLUENCERS_CLUB_API_KEY:
    logger.warning("INFLUENCERS_CLUB_API_KEY environment variable not set")


async def get_ic_client() -> InfluencersClubClient:
    """Dependency: Get the Influencers Club API client."""
    if not INFLUENCERS_CLUB_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Creator discovery service not configured. Missing API key.",
        )
    return await get_influencers_client(INFLUENCERS_CLUB_API_KEY)


# ============================================================================
# DISCOVERY ENDPOINTS
# ============================================================================

@router.post(
    "/search",
    response_model=DiscoverySearchResponse,
    summary="Search creators with advanced filters",
    description="Discover creators using the influencers.club Discovery API with advanced filtering"
)
async def search_creators(
    request: CreatorDiscoveryRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_permission("discovery_read")),
    client: InfluencersClubClient = Depends(get_ic_client),
):
    """
    Search for creators based on platform and filters.
    
    Supports:
    - AI keyword search
    - Follower count ranges
    - Engagement rate filters
    - Location filtering
    - Verified status, brand deals, merch, etc.
    - Platform-specific filters
    
    Returns paginated results with creator profiles.
    """
    try:
        # Build filter dict from request, excluding None values
        filters = request.filters.model_dump(exclude_none=True)
        
        logger.info(
            f"Searching creators on {request.platform} with filters. User: {current_user.id}"
        )
        
        # Call Influencers Club API
        response = await client.discover_creators(
            platform=request.platform.value,
            filters=filters,
            limit=request.limit,
            offset=request.offset,
        )
        
        # Parse response and save creators to database
        creators_data = response.get("accounts", [])
        total = response.get("total", 0)
        credits_used = response.get("credits_cost", 0)
        
        # Store creators in database for future reference
        for creator_data in creators_data:
            await _save_discovered_creator(db, current_user.org_id, creator_data)
        
        # Fetch stored creators from database
        stmt = (
            select(Creator)
            .where(Creator.org_id == current_user.org_id)
            .limit(request.limit)
            .offset(request.offset)
        )
        db_creators = await db.execute(stmt)
        creators = db_creators.scalars().all()
        
        return DiscoverySearchResponse(
            total_results=total,
            limit=request.limit,
            offset=request.offset,
            results=[CreatorDetailResponse.model_validate(c) for c in creators],
            has_more=request.offset + request.limit < total,
            credits_used=credits_used,
        )
    
    except ValueError as e:
        logger.error(f"Invalid API key: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Creator discovery service configuration error"
        )
    except Exception as e:
        logger.error(f"Creator search error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search creators: {str(e)}"
        )


@router.post(
    "/search-keyword",
    response_model=DiscoverySearchResponse,
    summary="Quick creator search by keyword",
)
async def search_by_keyword(
    request: CreatorSearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_permission("discovery_read")),
    client: InfluencersClubClient = Depends(get_ic_client),
):
    """
    Quick search for creators using AI keyword search.
    
    Example: "fitness influencers" or "sustainable fashion creators"
    """
    try:
        logger.info(
            f"Keyword search for '{request.keyword}' on {request.platform}. User: {current_user.id}"
        )
        
        response = await client.search_creators_by_keyword(
            platform=request.platform.value,
            keyword=request.keyword,
            follower_min=request.follower_min,
            follower_max=request.follower_max,
            limit=request.limit,
        )
        
        creators_data = response.get("accounts", [])
        total = response.get("total", 0)
        credits_used = response.get("credits_cost", 0)
        
        # Store in database
        for creator_data in creators_data:
            await _save_discovered_creator(db, current_user.org_id, creator_data)
        
        stmt = select(Creator).where(Creator.org_id == current_user.org_id).limit(request.limit)
        db_creators = await db.execute(stmt)
        creators = db_creators.scalars().all()
        
        return DiscoverySearchResponse(
            total_results=total,
            limit=request.limit,
            offset=0,
            results=[CreatorDetailResponse.model_validate(c) for c in creators],
            has_more=request.limit < total,
            credits_used=credits_used,
        )
    
    except Exception as e:
        logger.error(f"Keyword search error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search creators: {str(e)}"
        )


# ============================================================================
# ENRICHMENT ENDPOINTS
# ============================================================================

@router.post(
    "/enrich",
    response_model=EnrichmentResponse,
    summary="Enrich creator profile by handle",
)
async def enrich_creator(
    request: CreatorEnrichmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_permission("discovery_write")),
    client: InfluencersClubClient = Depends(get_ic_client),
):
    """
    Get detailed creator profile information by social media handle.
    
    Enrichment modes:
    - raw: Basic info (0.03 credits)
    - full: Complete profile with email, growth trends, all stats (1 credit)
    
    Supports: Instagram, TikTok, YouTube, Twitter, Twitch, OnlyFans
    """
    try:
        logger.info(
            f"Enriching {request.handle} on {request.platform} ({request.enrichment_mode}). "
            f"User: {current_user.id}"
        )
        
        response = await client.enrich_handle(
            handle=request.handle,
            platform=request.platform.value,
            enrichment_mode=request.enrichment_mode.value,
            email_required=request.email_required,
        )
        
        # Save enrichment to database
        creator = await _save_enriched_creator(db, current_user.org_id, response)
        
        # Log enrichment for audit
        await _log_enrichment(
            db,
            creator.id,
            f"handle_{request.enrichment_mode.value}",
            request.platform.value,
            credits_used=1.0 if request.enrichment_mode == "full" else 0.03,
            success=True,
        )
        
        await db.commit()
        
        return EnrichmentResponse(
            creator=CreatorDetailResponse.model_validate(creator),
            credits_used=1.0 if request.enrichment_mode == "full" else 0.03,
            enrichment_mode=request.enrichment_mode.value,
            enriched_at=datetime.utcnow(),
        )
    
    except Exception as e:
        logger.error(f"Enrichment error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enrich creator: {str(e)}"
        )


# ============================================================================
# CREDITS AND INFO ENDPOINTS
# ============================================================================

@router.get(
    "/credits",
    response_model=CreditsResponse,
    summary="Check API credit balance",
)
async def check_credits(
    current_user = Depends(require_permission("discovery_read")),
    client: InfluencersClubClient = Depends(get_ic_client),
):
    """
    Check remaining API credits for influencers.club service.
    
    Credit costs:
    - Creator discovery: 0.01 per creator (max 50 = 0.5 per request)
    - Handle enrichment (raw): 0.03 credits
    - Handle enrichment (full): 1.0 credit
    - Email enrichment (basic): 0.1 credit
    - Email enrichment (advanced): 2.0 credits
    - Post engagement data: 0.03 credits
    """
    try:
        credits = await client.get_credits()
        
        return CreditsResponse(
            available_credits=credits["available_credits"],
            used_credits=credits["used_credits"],
            total_credits=credits["available_credits"] + credits["used_credits"],
        )
    
    except Exception as e:
        logger.error(f"Error checking credits: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check API credits"
        )


# ============================================================================
# MANAGE CREATORS ENDPOINTS
# ============================================================================

@router.get(
    "/creators",
    response_model=list[CreatorListResponse],
    summary="List discovered creators",
)
async def list_creators(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_permission("discovery_read")),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Get list of discovered/enriched creators for the organization.
    """
    try:
        stmt = (
            select(Creator)
            .where(Creator.org_id == current_user.org_id)
            .order_by(Creator.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(stmt)
        creators = result.scalars().all()
        
        return [CreatorListResponse.model_validate(c) for c in creators]
    
    except Exception as e:
        logger.error(f"Error listing creators: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list creators"
        )


@router.get(
    "/creators/{creator_id}",
    response_model=CreatorDetailResponse,
    summary="Get creator details",
)
async def get_creator(
    creator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_permission("discovery_read")),
):
    """
    Get detailed profile information for a specific creator.
    """
    try:
        stmt = (
            select(Creator)
            .where(
                (Creator.id == creator_id) &
                (Creator.org_id == current_user.org_id)
            )
        )
        result = await db.execute(stmt)
        creator = result.scalar_one_or_none()
        
        if not creator:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Creator not found"
            )
        
        return CreatorDetailResponse.model_validate(creator)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creator: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch creator"
        )


@router.get(
    "/stats",
    response_model=CreatorStatsResponse,
    summary="Get creator statistics",
)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_permission("discovery_read")),
):
    """
    Get aggregate statistics about discovered creators.
    """
    try:
        # Get all creators for org
        stmt = select(Creator).where(Creator.org_id == current_user.org_id)
        result = await db.execute(stmt)
        creators = result.scalars().all()
        
        total = len(creators)
        if total == 0:
            return CreatorStatsResponse(
                total_creators=0,
                average_followers=0,
                average_engagement_rate=0,
                verified_count=0,
                has_brand_deals_count=0,
                has_merch_count=0,
                by_platform={},
            )
        
        avg_followers = sum(c.total_followers for c in creators) / total
        avg_engagement = sum(c.total_engagement_rate for c in creators) / total
        verified_count = sum(1 for c in creators if c.is_verified)
        brand_deals_count = sum(1 for c in creators if c.has_done_brand_deals)
        merch_count = sum(1 for c in creators if c.has_merch)
        
        # Count by platform
        by_platform = {}
        for creator in creators:
            for profile in creator.social_profiles:
                by_platform[profile.platform] = by_platform.get(profile.platform, 0) + 1
        
        return CreatorStatsResponse(
            total_creators=total,
            average_followers=avg_followers,
            average_engagement_rate=avg_engagement,
            verified_count=verified_count,
            has_brand_deals_count=brand_deals_count,
            has_merch_count=merch_count,
            by_platform=by_platform,
        )
    
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get statistics"
        )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def _save_discovered_creator(
    db: AsyncSession,
    org_id: int,
    creator_data: dict
) -> Optional[Creator]:
    """Save a discovered creator to the database."""
    try:
        email = creator_data.get("email")
        
        # Check if creator already exists
        stmt = select(Creator).where(
            (Creator.org_id == org_id) &
            ((Creator.email == email) if email else False)
        )
        result = await db.execute(stmt)
        creator = result.scalar_one_or_none()
        
        if creator:
            # Update existing creator
            creator.raw_data = creator_data
            creator.last_enriched_at = datetime.utcnow()
        else:
            # Create new creator
            creator = Creator(
                org_id=org_id,
                name=creator_data.get("name", "Unknown"),
                email=email,
                country=creator_data.get("country"),
                city=creator_data.get("city"),
                total_followers=sum(
                    sp.get("follower_count", 0)
                    for sp in creator_data.get("social_profiles", [])
                ),
                raw_data=creator_data,
                influencers_club_id=creator_data.get("id"),
            )
            db.add(creator)
        
        await db.flush()
        return creator
    
    except Exception as e:
        logger.error(f"Error saving creator: {e}")
        return None


async def _save_enriched_creator(
    db: AsyncSession,
    org_id: int,
    creator_data: dict
) -> Creator:
    """Save an enriched creator profile to the database."""
    email = creator_data.get("email")
    handle = creator_data.get("username")
    platform = creator_data.get("platform", "unknown")
    
    # Check if creator exists
    stmt = select(Creator).where(
        (Creator.org_id == org_id) &
        ((Creator.email == email) if email else False)
    )
    result = await db.execute(stmt)
    creator = result.scalar_one_or_none()
    
    if not creator:
        creator = Creator(
            org_id=org_id,
            name=creator_data.get("full_name", handle or "Unknown"),
            email=email,
            is_verified=creator_data.get("is_verified", False),
            raw_data=creator_data,
            influencers_club_id=creator_data.get("id"),
        )
        db.add(creator)
        await db.flush()
    
    # Update or create social profile
    stmt = select(CreatorSocialProfile).where(
        (CreatorSocialProfile.creator_id == creator.id) &
        (CreatorSocialProfile.platform == platform) &
        (CreatorSocialProfile.handle == handle)
    )
    result = await db.execute(stmt)
    social_profile = result.scalar_one_or_none()
    
    if not social_profile:
        social_profile = CreatorSocialProfile(
            creator_id=creator.id,
            platform=platform,
            handle=handle,
        )
        db.add(social_profile)
        await db.flush()
    
    # Update profile with enriched data
    social_profile.follower_count = creator_data.get("follower_count", 0)
    social_profile.engagement_rate = creator_data.get("engagement_percent", 0)
    social_profile.bio = creator_data.get("biography")
    social_profile.is_verified = creator_data.get("is_verified", False)
    social_profile.raw_data = creator_data
    
    # Update creator aggregate data
    creator.total_followers = social_profile.follower_count
    creator.total_engagement_rate = social_profile.engagement_rate
    creator.is_verified = social_profile.is_verified
    creator.has_done_brand_deals = creator_data.get("has_done_brand_deals", False)
    creator.has_merch = creator_data.get("has_merch", False)
    creator.has_link_in_bio = creator_data.get("has_link_in_bio", False)
    creator.promotesaffil_links = creator_data.get("promotes_affiliate_links", False)
    
    await db.flush()
    return creator


async def _log_enrichment(
    db: AsyncSession,
    creator_id: int,
    enrichment_type: str,
    platform: str,
    credits_used: float,
    success: bool,
    error_message: Optional[str] = None,
):
    """Log enrichment API call for auditing."""
    log = CreatorEnrichmentLog(
        creator_id=creator_id,
        enrichment_type=enrichment_type,
        platform=platform,
        credits_used=credits_used,
        success=success,
        error_message=error_message,
    )
    db.add(log)
    await db.flush()
