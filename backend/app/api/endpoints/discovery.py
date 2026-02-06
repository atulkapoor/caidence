"""
Creator discovery endpoints powered by Influencers Club API v1
Enables real-time creator discovery & enrichment across major social platforms

Official API: https://api-dashboard.influencers.club
Documentation: https://app.theneo.io/influencers-club/influencers-public-api
"""

import logging
import os
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, Query, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

# Database & Auth
from app.core.database import get_db
from app.models.models import User, CreatorSearch, CreditTransaction
from app.api.deps import require_discovery_read

# Credit tracking
from app.services.credit_service import CreditService, CREDIT_COSTS

# Influencers Club API Integration
from app.integrations.influencers_club import get_influencers_client
import httpx
import asyncio
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()

# Get API key from environment
INFLUENCERS_CLUB_API_KEY = os.getenv("INFLUENCERS_CLUB_API_KEY")

if not INFLUENCERS_CLUB_API_KEY:
    logger.warning(
        "INFLUENCERS_CLUB_API_KEY environment variable not set. "
        "Discovery endpoints will not work without it. "
        "Add to .env: INFLUENCERS_CLUB_API_KEY=your_api_key"
    )


async def get_ic_client():
    """Dependency: Get or create Influencers Club API client"""
    if not INFLUENCERS_CLUB_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Discovery service not configured. Set INFLUENCERS_CLUB_API_KEY environment variable."
        )
    
    try:
        return await get_influencers_client(INFLUENCERS_CLUB_API_KEY)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"API client initialization error: {str(e)}"
        )


# ============================================================================
# CREATOR DISCOVERY API
# ============================================================================

@router.post(
    "/search",
    summary="Discover creators with advanced filters",
    description="Search for creators on Instagram, TikTok, YouTube, etc. with advanced filtering",
    tags=["discovery"]
)
async def discover_creators(
    platform: Optional[str] = Query(
        None,
        description="Social platform: instagram, tiktok, youtube, twitter, twitch, onlyfans"
    ),
    ai_search: Optional[str] = Query(
        None,
        description='Natural language search (e.g., "fitness influencers with high engagement")'
    ),
    min_followers: Optional[int] = Query(None, description="Minimum follower count"),
    max_followers: Optional[int] = Query(None, description="Maximum follower count"),
    min_engagement: Optional[float] = Query(None, description="Minimum engagement rate (%)"),
    location: Optional[List[str]] = Query(None, description="Geographic locations"),
    has_brand_deals: Optional[bool] = Query(None, description="Filter to creators with brand deals"),
    is_verified: Optional[bool] = Query(None, description="Filter to verified accounts"),
    limit: int = Query(20, ge=1, le=50, description="Results per page (max 50)"),
    page: int = Query(1, ge=1, description="Page number"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_discovery_read),
    client = Depends(get_ic_client),
    payload: Optional[dict] = Body(None)
):
    """
    Discover creators using Influencers Club API

    Supports 100+ filter options including:
    - AI keyword search
    - Follower count range
    - Engagement metrics
    - Geographic targeting
    - Brand deal history
    - Verification status
    - And more...

    **Cost:** 0.01 credits per creator
    
    **Example:**
    - `/discovery/search?platform=instagram&ai_search=fashion%20influencers&min_followers=10000`
    """
    try:
        # Check user credits - get_balance now auto-initializes if needed
        estimated_credits = limit * CREDIT_COSTS['discovery_search']
        balance, monthly_limit = await CreditService.get_balance(db, current_user.id)
        
        logger.info(
            f"User {current_user.id} credit check: balance={balance}, "
            f"estimated cost={estimated_credits}, limit={monthly_limit}"
        )
        
        if balance < estimated_credits:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Insufficient credits. Balance: {balance:.2f}, Required: {estimated_credits:.2f}"
            )
        
        # Build filter dictionary and accept JSON body `{ query, filters }` for compatibility
        filters = {}

        body = payload or {}

        # If frontend sent a `query` in the JSON body, prefer it when ai_search not provided
        if body.get("query") and not ai_search:
            ai_search = body.get("query")

        # If platform not provided as a query param, accept from body.filters.platform
        body_filters = body.get("filters") or {}
        if not platform and isinstance(body_filters, dict):
            platform = body_filters.get("platform")
        if platform:
            platform = platform.lower()

        if ai_search:
            filters["ai_search"] = ai_search

        # Merge any filters from the JSON body into our filters dict
        if isinstance(body_filters, dict):
            # Remove platform from filters (handled separately)
            body_filters.pop("platform", None)
            filters.update(body_filters)

        if not platform:
            raise HTTPException(status_code=400, detail="platform is required either as query param or in filters.platform")
        
        if min_followers or max_followers:
            filters["number_of_followers"] = {}
            if min_followers:
                filters["number_of_followers"]["min"] = min_followers
            if max_followers:
                filters["number_of_followers"]["max"] = max_followers
        
        if min_engagement is not None:
            filters["engagement_percent"] = {"min": min_engagement}
        
        if location:
            filters["location"] = location
        
        if has_brand_deals is not None:
            filters["has_done_brand_deals"] = has_brand_deals
        
        if is_verified is not None:
            filters["is_verified"] = is_verified
        
        # Call real API
        result = await client.discover_creators(
            platform=platform,
            filters=filters,
            limit=limit,
            page=page
        )
        
        # Get actual result count
        result_count = len(result.get('accounts', []))
        actual_credits_cost = result_count * CREDIT_COSTS['discovery_search']
        
        # Deduct actual credits used
        success, msg = await CreditService.deduct_credits(
            db,
            user_id=current_user.id,
            amount=actual_credits_cost,
            transaction_type='discovery_search',
            description=f"Search {platform} with query '{ai_search or 'no query'}'. Found {result_count} creators."
        )
        
        if success:
            # Log the search
            search_log = CreatorSearch(
                user_id=current_user.id,
                query=ai_search or '',
                platform=platform,
                filters=str(filters),
                result_count=result_count,
                credits_used=actual_credits_cost
            )
            db.add(search_log)
            await db.commit()
            
            # Include credit info in response
            result['credits_deducted'] = actual_credits_cost
            result['credits_remaining'] = balance - actual_credits_cost
        
        logger.info(
            f"Discovery: {result_count} creators found on {platform}. "
            f"Credits deducted: {actual_credits_cost}. "
            f"Credits remaining: {result.get('credits_remaining', 0)}"
        )
        
        return result
    
    except HTTPException:
        raise
    except ValueError as e:
        error_msg = str(e)
        logger.warning(f"Validation error in discovery_creators: {error_msg}")
        # Return 400 for invalid request format, not 401
        if "Invalid" in error_msg or "format" in error_msg.lower():
            raise HTTPException(status_code=400, detail=error_msg)
        raise HTTPException(status_code=401, detail=error_msg)
    except PermissionError as e:
        logger.warning(f"Permission error in discovery_creators: {e}")
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Discovery API error: {type(e).__name__}: {e}", exc_info=True)
        # Default to 502 for external API errors
        raise HTTPException(status_code=502, detail=f"Discovery service error: {str(e)[:100]}")


# ============================================================================
# SIMILAR CREATORS (LOOKALIKE SEARCH)
# ============================================================================

@router.post(
    "/similar",
    summary="Find creators similar to a given creator",
    description="Find lookalike creators based on a reference creator",
    tags=["discovery"]
)
async def find_similar_creators(
    platform: str = Query(...),
    handle: str = Query(..., description="Reference creator username"),
    min_followers: Optional[int] = Query(None),
    max_followers: Optional[int] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    page: int = Query(1, ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_discovery_read),
    client = Depends(get_ic_client)
):
    """
    Find creators with similar profiles and audience demographics
    
    **Cost:** 0.01 credits per creator
    """
    try:
        filters = {}
        
        if min_followers or max_followers:
            filters["number_of_followers"] = {}
            if min_followers:
                filters["number_of_followers"]["min"] = min_followers
            if max_followers:
                filters["number_of_followers"]["max"] = max_followers
        
        result = await client.find_similar_creators(
            platform=platform,
            filter_key="username",
            filter_value=handle,
            filters=filters or None,
            limit=limit,
            page=page
        )
        
        logger.info(f"Found {result.get('total', 0)} similar creators to {handle}")
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error(f"Error finding similar creators: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CREATOR ENRICHMENT
# ============================================================================

@router.post(
    "/enrich",
    summary="Enrich creator profile by handle",
    description="Get detailed creator data and metrics",
    tags=["discovery"]
)
async def enrich_creator(
    platform: str = Query(...),
    handle: str = Query(..., description="Creator username/handle"),
    mode: str = Query("raw", description="enrichment mode: 'raw' (0.03) or 'full' (1 credit)"),
    current_user: User = Depends(require_discovery_read),
    client = Depends(get_ic_client)
):
    """
    Enrich creator profile with detailed information
    
    **Raw mode (0.03 credits):**
    - Basic profile info
    - User data
    - Recent posts
    
    **Full mode (1 credit):**
    - All raw data plus
    - Email address
    - Growth trends
    - Posting frequency
    - Platform connections
    - Complete engagement metrics
    """
    try:
        result = await client.enrich_creator_handle(
            platform=platform,
            handle=handle,
            enrichment_mode=mode
        )
        
        logger.info(f"Enriched {handle} on {platform} ({mode} mode)")
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error(f"Error enriching creator: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# POST ENGAGEMENT METRICS
# ============================================================================

@router.post(
    "/post-details",
    summary="Get post engagement metrics",
    description="Retrieve detailed engagement data for a specific post",
    tags=["discovery"]
)
async def get_post_engagement(
    platform: str = Query(..., description="instagram, tiktok, or youtube"),
    post_id: str = Query(..., description="Unique post ID"),
    content_type: str = Query("data", description="data, comments, transcript, or audio"),
    current_user: User = Depends(require_discovery_read),
    client = Depends(get_ic_client)
):
    """
    Get post details including:
    - Engagement metrics (likes, comments, shares)
    - Audience demographics
    - Reach and impressions
    - Top commenters
    - Timestamps and analytics
    
    **Cost:** 0.03 credits
    """
    try:
        result = await client.get_post_details(
            platform=platform,
            post_id=post_id,
            content_type=content_type
        )
        
        logger.info(f"Retrieved {content_type} for post {post_id}")
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving post details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CLASSIFIER ENDPOINTS (Filter Options)
# ============================================================================

@router.get(
    "/classifiers/languages",
    summary="Get available languages for filtering",
    tags=["classifiers"]
)
async def get_languages(
    current_user: User = Depends(require_discovery_read),
    client = Depends(get_ic_client)
):
    """Get list of languages available in profile_language filter"""
    try:
        return await client.get_languages()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get(
    "/classifiers/locations/{platform}",
    summary="Get available locations for a platform",
    tags=["classifiers"]
)
async def get_locations(
    platform: str,
    current_user: User = Depends(require_discovery_read),
    client = Depends(get_ic_client)
):
    """Get list of locations (countries/cities) available for a platform"""
    try:
        return await client.get_locations(platform)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get(
    "/classifiers/yt-topics",
    summary="Get available YouTube topics",
    tags=["classifiers"]
)
async def get_youtube_topics(
    current_user: User = Depends(require_discovery_read),
    client = Depends(get_ic_client)
):
    """Get list of YouTube video topics for filtering"""
    try:
        return await client.get_youtube_topics()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get(
    "/classifiers/twitch-games",
    summary="Get available Twitch games",
    tags=["classifiers"]
)
async def get_twitch_games(
    current_user: User = Depends(require_discovery_read),
    client = Depends(get_ic_client)
):
    """Get list of Twitch games for the games_played filter"""
    try:
        return await client.get_twitch_games()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get(
    "/smoke",
    summary="Smoke test discovery integration",
    description="Validate server logging, API key presence and a lightweight call to Influencers Club",
    tags=["discovery"]
)
async def discovery_smoke(
    current_user: User = Depends(require_discovery_read),
    client = Depends(get_ic_client)
):
    """
    Smoke test for Influencers Club API integration.
    Performs a lightweight discovery search to validate:
    - API key is properly configured
    - Network connectivity works
    - Authentication succeeds
    
    Uses minimal filters and limit=1 for fastest execution.
    """
    logger.info("Discovery smoke check initiated by user %s", getattr(current_user, 'email', 'anonymous'))


# ============================================================================
# CREDIT MANAGEMENT
# ============================================================================

@router.get(
    "/credits",
    summary="Get user credit balance and usage stats",
    tags=["credits"]
)
async def get_credits(
    days: int = Query(30, ge=1, le=90, description="Number of days for usage stats"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_discovery_read)
):
    """
    Get current credit balance, monthly limit, and usage statistics.
    
    Returns:
    - `balance`: Current available credits
    - `monthly_limit`: Monthly allotment
    - `usage_stats`: Statistics for last N days
    - `transaction_history`: Recent transactions (limited)
    """
    try:
        balance, monthly_limit = await CreditService.get_balance(db, current_user.id)
        
        # Get usage stats for the period
        usage_stats = await CreditService.get_credit_usage_stats(db, current_user.id, days=days)
        
        # Get recent transactions
        from sqlalchemy import select
        result = await db.execute(
            select(CreditTransaction)
            .where(CreditTransaction.user_id == current_user.id)
            .order_by(CreditTransaction.created_at.desc())
            .limit(20)
        )
        transactions = result.scalars().all()
        
        transaction_history = [
            {
                'type': t.transaction_type,
                'amount': t.amount,
                'balance_after': t.balance_after,
                'description': t.description,
                'created_at': t.created_at.isoformat(),
            }
            for t in transactions
        ]
        
        return {
            'balance': balance,
            'monthly_limit': monthly_limit,
            'percent_used': ((monthly_limit - balance) / monthly_limit * 100) if monthly_limit > 0 else 0,
            'usage_stats': usage_stats,
            'transaction_history': transaction_history,
        }
    
    except Exception as e:
        logger.error(f"Error getting credits for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/credits/initialize",
    summary="Initialize credit account for user",
    tags=["credits"]
)
async def initialize_credits(
    initial_balance: float = Query(1000.0, description="Initial credit balance"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_discovery_read)
):
    """
    Initialize credit account for user (admin-only in production).
    """
    try:
        account = await CreditService.initialize_credits(
            db,
            current_user.id,
            initial_balance=initial_balance
        )
        
        await db.commit()
        
        return {
            'success': True,
            'account_id': account.id,
            'balance': account.balance,
            'monthly_limit': account.monthly_allotment
        }
    
    except Exception as e:
        await db.rollback()
        logger.error(f"Error initializing credits for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    result = {
        "api_key_present": bool(INFLUENCERS_CLUB_API_KEY),
        "client_initialized": False,
        "remote_call_ok": False,
        "message": "",
    }

    try:
        # Ensure client creation works
        result["client_initialized"] = True

        # Try a lightweight discovery search with minimal filters for fastest execution
        try:
            # Perform minimal discovery search with no filters, limit=1 for fast smoke test
            discovery_result = await asyncio.wait_for(
                client.discover_creators(
                    platform="instagram",
                    filters={},  # Empty filters = any creator
                    limit=1,     # Minimal result set
                    page=1
                ),
                timeout=15.0  # Reasonable timeout for lightweight query
            )
            result["remote_call_ok"] = True
            total = discovery_result.get('total', 'unknown')
            result["message"] = f"OK - Discovery search completed. Total creators: {total:,}"
            logger.info("Discovery smoke test passed: %s", result["message"])
        except asyncio.TimeoutError:
            result["message"] = "Timed out contacting Influencers Club API (15s timeout)"
            logger.warning("Discovery smoke test timed out")
        except ValueError as e:
            # Validation errors from client
            result["message"] = f"Configuration error: {str(e)}"
            logger.warning(f"Discovery smoke config error: {result['message']}")
        except PermissionError as e:
            # Permission/auth errors
            result["message"] = f"Authentication error: {str(e)}"
            logger.warning(f"Discovery smoke auth error: {result['message']}")
        except Exception as e:
            result["message"] = f"API error: {type(e).__name__}: {str(e)[:80]}"
            logger.warning(f"Discovery smoke API error: {result['message']}")

        status_code = 200 if result["remote_call_ok"] else 502
        return JSONResponse(status_code=status_code, content=result)

    except Exception as e:
        logger.exception("Failure during discovery smoke check")
        raise HTTPException(status_code=500, detail=str(e))
