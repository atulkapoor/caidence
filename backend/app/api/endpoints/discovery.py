"""
Creator discovery endpoints powered by Influencers Club API v1
Enables real-time creator discovery & enrichment across major social platforms

Official API: https://api-dashboard.influencers.club
Documentation: https://app.theneo.io/influencers-club/influencers-public-api
"""

import logging
import os
from typing import Optional, List
import re
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends, Query, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv

# Database & Auth
from app.core.database import get_db
from app.models.models import User, CreatorSearch, CreditTransaction
from app.api.deps import require_discovery_read

# Credit tracking
from app.services.credit_service import CreditService, CREDIT_COSTS

# Influencers Club API Integration
from app.integrations.influencers_club import get_influencers_client
import httpx

logger = logging.getLogger(__name__)

router = APIRouter()

# Load backend/.env directly for discovery API key resolution.
_BACKEND_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(_BACKEND_ROOT / ".env", override=False)


def _extract_external_error_message(error_msg: str) -> str:
    """
    Parse nested JSON error payloads from upstream messages like:
    Invalid request format: {"error":"..."}
    """
    if not error_msg:
        return "Unknown discovery service error"

    marker = "Invalid request format:"
    if marker in error_msg:
        raw_payload = error_msg.split(marker, 1)[1].strip()
        try:
            parsed = json.loads(raw_payload)
            if isinstance(parsed, dict):
                if parsed.get("error"):
                    return str(parsed["error"])
                if parsed.get("detail"):
                    return str(parsed["detail"])
        except Exception:
            pass

    # Generic embedded JSON payloads, e.g.
    # Insufficient permissions: {"detail":"Your trial access has expired..."}
    json_start = error_msg.find("{")
    if json_start != -1:
        raw_payload = error_msg[json_start:].strip()
        try:
            parsed = json.loads(raw_payload)
            if isinstance(parsed, dict):
                if parsed.get("detail"):
                    return str(parsed["detail"])
                if parsed.get("error"):
                    return str(parsed["error"])
        except Exception:
            pass
    return error_msg

def _get_influencers_club_api_key() -> Optional[str]:
    """Resolve API key directly from environment/.env."""
    key = (os.getenv("INFLUENCERS_CLUB_API_KEY") or "").strip()
    key = key.strip("'").strip('"')
    if key.lower().startswith("bearer "):
        key = key[7:].strip()
    return key or None


async def get_ic_client():
    """Dependency: Get or create Influencers Club API client"""
    api_key = _get_influencers_club_api_key()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Discovery service not configured. Set INFLUENCERS_CLUB_API_KEY environment variable."
        )
    
    try:
        return await get_influencers_client(api_key)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"API client initialization error: {str(e)}"
        )


def _normalize_frontend_filters(raw_filters: dict) -> dict:
    """
    Normalize frontend filter shape to Influencers Club API filter shape.
    Frontend currently sends keys like: min_reach, engagement, geo, niche.
    """
    normalized = dict(raw_filters or {})

    min_reach = normalized.pop("min_reach", None)
    if min_reach is not None:
        followers_filter = normalized.get("number_of_followers")
        if not isinstance(followers_filter, dict):
            followers_filter = {}
        followers_filter["min"] = min_reach
        normalized["number_of_followers"] = followers_filter

    max_reach = normalized.pop("max_reach", None)
    if max_reach is not None:
        followers_filter = normalized.get("number_of_followers")
        if not isinstance(followers_filter, dict):
            followers_filter = {}
        followers_filter["max"] = max_reach
        normalized["number_of_followers"] = followers_filter

    engagement = normalized.pop("engagement", None)
    if engagement is not None:
        engagement_filter = normalized.get("engagement_percent")
        if not isinstance(engagement_filter, dict):
            engagement_filter = {}
        engagement_filter["min"] = engagement
        normalized["engagement_percent"] = engagement_filter

    geo = normalized.pop("geo", None)
    if geo:
        if isinstance(geo, list):
            normalized["location"] = [str(code).strip() for code in geo if str(code).strip()]
        else:
            code = str(geo).strip()
            if code:
                normalized["location"] = [code]

    niche = normalized.pop("niche", None)
    if niche:
        normalized["niche"] = niche

    return normalized


_COUNTRY_CODE_TO_NAME = {
    "IN": "India",
    "US": "United States",
    "UK": "United Kingdom",
    "GB": "United Kingdom",
    "CA": "Canada",
    "AU": "Australia",
    "DE": "Germany",
    "FR": "France",
}


def _normalize_location_entry(entry: object) -> List[str]:
    """Extract searchable aliases from classifier location entries."""
    values: List[str] = []
    if isinstance(entry, str):
        text = entry.strip()
        if text:
            values.append(text)
        return values

    if isinstance(entry, dict):
        for key in ("value", "name", "label", "country", "country_name", "code", "country_code"):
            val = entry.get(key)
            if val:
                values.append(str(val).strip())
    return [v for v in values if v]


async def _resolve_location_filter_for_platform(client, platform: str, filters: dict) -> dict:
    """
    Resolve frontend `location` values (often ISO codes) to provider-accepted
    values for a specific platform. Invalid values are dropped instead of
    failing the entire search.
    """
    locations = filters.get("location")
    if not isinstance(locations, list) or not locations:
        return filters

    try:
        available_raw = await client.get_locations(platform)
    except Exception as e:
        logger.warning("Failed loading location classifiers for %s: %s", platform, e)
        return filters

    available_alias_to_canonical = {}
    for item in (available_raw or []):
        aliases = _normalize_location_entry(item)
        if not aliases:
            continue
        canonical = aliases[0]
        for alias in aliases:
            available_alias_to_canonical[alias.lower()] = canonical

    resolved_locations: List[str] = []
    for loc in locations:
        raw = str(loc).strip()
        if not raw:
            continue
        candidates = [raw]
        mapped = _COUNTRY_CODE_TO_NAME.get(raw.upper())
        if mapped:
            candidates.append(mapped)

        matched = None
        for candidate in candidates:
            matched = available_alias_to_canonical.get(candidate.lower())
            if matched:
                break
        if matched:
            resolved_locations.append(matched)

    if resolved_locations:
        # Preserve order while removing duplicates
        filters["location"] = list(dict.fromkeys(resolved_locations))
    else:
        # Drop invalid location filter instead of returning provider 400
        filters.pop("location", None)
        logger.info(
            "Removed invalid location filter for platform=%s. Incoming locations=%s",
            platform,
            locations,
        )
    return filters


def _extract_username_candidate(search_text: Optional[str]) -> Optional[str]:
    """
    Treat plain handles/usernames as username filter candidates.
    Examples: '@creator_name', 'creator_name'
    """
    if not search_text:
        return None

    candidate = search_text.strip()
    if not candidate:
        return None

    if " " in candidate:
        return None

    candidate = candidate.lstrip("@")
    if not candidate:
        return None

    if re.fullmatch(r"[A-Za-z0-9._-]{2,64}", candidate):
        return candidate

    return None


def _extract_name_candidate(search_text: Optional[str]) -> Optional[str]:
    """
    Treat short person-name style queries as identity candidates.
    Examples: 'john doe', 'Jane Smith'
    """
    if not search_text:
        return None

    candidate = re.sub(r"\s+", " ", search_text.strip())
    if not candidate:
        return None
    if "@" in candidate:
        return None

    words = candidate.split(" ")
    if len(words) < 2 or len(words) > 4:
        return None

    if re.fullmatch(r"[A-Za-z][A-Za-z0-9 .'\-]{1,80}", candidate):
        return candidate

    return None


def _identity_matches_query(account: dict, query: str) -> bool:
    profile = account.get("profile") if isinstance(account, dict) else {}
    profile = profile if isinstance(profile, dict) else {}

    identity_fields = [
        account.get("username"),
        account.get("user_id"),
        account.get("name"),
        profile.get("username"),
        profile.get("full_name"),
        profile.get("name"),
    ]
    normalized_query = query.strip().lstrip("@").lower()
    if not normalized_query:
        return False

    for value in identity_fields:
        if not value:
            continue
        normalized_value = str(value).strip().lstrip("@").lower()
        if normalized_query in normalized_value:
            return True
    return False


def _apply_identity_result_filter(result: dict, search_text: Optional[str]) -> dict:
    """
    If query looks like a direct username/name lookup, keep only matching accounts.
    This runs after upstream filters so both identity + filters are respected.
    """
    if not isinstance(result, dict):
        return result

    accounts = result.get("accounts")
    if not isinstance(accounts, list) or not accounts:
        return result

    query = (search_text or "").strip()
    username_query = _extract_username_candidate(query)
    name_query = _extract_name_candidate(query)
    identity_query = username_query or name_query
    if not identity_query:
        return result

    filtered_accounts = [
        account for account in accounts
        if _identity_matches_query(account, identity_query)
    ]
    result["accounts"] = filtered_accounts
    result["total"] = len(filtered_accounts)
    return result


def _dedupe_accounts_in_result(result: dict) -> dict:
    """
    Remove duplicate accounts by (platform, username/user_id) so UI and credit usage
    are based on unique creators.
    """
    if not isinstance(result, dict):
        return result

    accounts = result.get("accounts")
    if not isinstance(accounts, list) or not accounts:
        return result

    seen = set()
    deduped = []
    for account in accounts:
        if not isinstance(account, dict):
            continue

        profile = account.get("profile") if isinstance(account.get("profile"), dict) else {}
        platform = str(
            profile.get("platform") or account.get("platform") or ""
        ).strip().lower()
        username = str(
            profile.get("username") or account.get("username") or account.get("user_id") or ""
        ).strip().lstrip("@").lower()

        if not username:
            # Keep unknown identities but avoid exact duplicate objects
            key = ("", str(account))
        else:
            key = (platform, username)

        if key in seen:
            continue
        seen.add(key)
        deduped.append(account)

    result["accounts"] = deduped
    result["total"] = len(deduped)
    return result


def _is_trial_expired_message(message: str) -> bool:
    return "trial access has expired" in (message or "").lower()


def _build_discovery_result_from_enrich(enriched: dict, platform: str) -> dict:
    """
    Normalize enrich response into discovery-like response shape so frontend can render it.
    """
    profile = {
        "username": enriched.get("username") or enriched.get("handle"),
        "full_name": enriched.get("full_name") or enriched.get("name"),
        "followers": enriched.get("follower_count") or enriched.get("followers") or 0,
        "engagement_percent": enriched.get("engagement_percent") or enriched.get("engagement_rate") or 0,
        "picture": enriched.get("picture") or enriched.get("profile_picture") or enriched.get("avatar_url"),
        "platform": (enriched.get("platform") or platform or "").lower(),
        "city": enriched.get("city"),
        "country": enriched.get("country"),
        "name": enriched.get("name"),
    }
    account = {
        "username": profile["username"],
        "user_id": enriched.get("id") or profile["username"],
        "name": profile["full_name"] or profile["name"],
        "platform": profile["platform"],
        "profile": profile,
    }
    return {"accounts": [account], "total": 1, "source": "enrich_fallback"}


def _apply_basic_filter_constraints_to_accounts(result: dict, filters: dict) -> dict:
    """
    Apply basic constraints to fallback accounts so behavior stays aligned with discovery filters.
    """
    if not isinstance(result, dict):
        return result
    accounts = result.get("accounts")
    if not isinstance(accounts, list):
        return result

    follower_filter = filters.get("number_of_followers") if isinstance(filters, dict) else None
    engagement_filter = filters.get("engagement_percent") if isinstance(filters, dict) else None
    location_filter = filters.get("location") if isinstance(filters, dict) else None
    verified_filter = filters.get("is_verified") if isinstance(filters, dict) else None

    def _match(account: dict) -> bool:
        profile = account.get("profile") if isinstance(account.get("profile"), dict) else {}
        followers = float(profile.get("followers") or profile.get("follower_count") or 0)
        engagement = float(profile.get("engagement_percent") or profile.get("engagement_rate") or 0)
        is_verified = bool(profile.get("is_verified") or account.get("is_verified"))
        country = str(profile.get("country") or account.get("country") or "").strip().lower()
        city = str(profile.get("city") or account.get("city") or "").strip().lower()

        if isinstance(follower_filter, dict):
            min_f = follower_filter.get("min")
            max_f = follower_filter.get("max")
            if min_f is not None and followers < float(min_f):
                return False
            if max_f is not None and followers > float(max_f):
                return False

        if isinstance(engagement_filter, dict):
            min_e = engagement_filter.get("min")
            max_e = engagement_filter.get("max")
            if min_e is not None and engagement < float(min_e):
                return False
            if max_e is not None and engagement > float(max_e):
                return False

        if isinstance(location_filter, list) and location_filter:
            normalized_targets = {str(v).strip().lower() for v in location_filter if str(v).strip()}
            if normalized_targets and country not in normalized_targets and city not in normalized_targets:
                return False

        if verified_filter is not None and bool(verified_filter) != is_verified:
            return False

        return True

    filtered = [acc for acc in accounts if isinstance(acc, dict) and _match(acc)]
    result["accounts"] = filtered
    result["total"] = len(filtered)
    return result


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
            filters.update(_normalize_frontend_filters(body_filters))

        # Convert "niche" into ai_search augmentation (broader API compatibility).
        niche = filters.pop("niche", None)
        if niche:
            if filters.get("ai_search"):
                filters["ai_search"] = f"{filters['ai_search']} {niche}"
            else:
                filters["ai_search"] = f"{niche} creators"

        # If user typed a direct username/handle, apply exact username filter
        # while still preserving broader ai_search context.
        username = _extract_username_candidate(ai_search)
        if username and "username" not in filters:
            filters["username"] = username

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

        if platform and filters.get("location"):
            filters = await _resolve_location_filter_for_platform(client, platform, filters)
        
        # Call real API
        try:
            result = await client.discover_creators(
                platform=platform,
                filters=filters,
                limit=limit,
                page=page
            )
        except (ValueError, PermissionError) as e:
            external_msg = _extract_external_error_message(str(e))
            # Fallback path: if discovery search trial is expired, still try direct handle enrich.
            if _is_trial_expired_message(external_msg) and username:
                logger.warning(
                    "Discovery trial expired; attempting enrich fallback for username=%s platform=%s",
                    username,
                    platform,
                )
                enriched = await client.enrich_creator_handle(
                    platform=platform,
                    handle=username,
                    enrichment_mode="raw",
                )
                result = _build_discovery_result_from_enrich(enriched, platform)
            else:
                raise

        result = _apply_identity_result_filter(result, ai_search)
        result = _dedupe_accounts_in_result(result)

        # Discovery may miss exact handles on some platforms; enrich fallback improves exact-match reliability.
        if username and len(result.get("accounts", []) or []) == 0:
            try:
                enriched = await client.enrich_creator_handle(
                    platform=platform,
                    handle=username,
                    enrichment_mode="raw",
                )
                result = _build_discovery_result_from_enrich(enriched, platform)
                result = _apply_basic_filter_constraints_to_accounts(result, filters)
                result = _apply_identity_result_filter(result, ai_search)
                result = _dedupe_accounts_in_result(result)
                result["source"] = "enrich_zero_result_fallback"
            except Exception as e:
                logger.info(
                    "Zero-result enrich fallback failed for username=%s platform=%s: %s",
                    username,
                    platform,
                    e,
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
        external_msg = _extract_external_error_message(error_msg)
        if _is_trial_expired_message(external_msg):
            raise HTTPException(status_code=402, detail=external_msg)
        # Return 400 for invalid request format, not 401
        if "Invalid" in error_msg or "format" in error_msg.lower():
            raise HTTPException(status_code=400, detail=external_msg)
        raise HTTPException(status_code=502, detail=external_msg)
    except PermissionError as e:
        error_msg = str(e)
        external_msg = _extract_external_error_message(error_msg)
        logger.warning(f"Permission error in discovery_creators: {external_msg}")
        if _is_trial_expired_message(external_msg):
            raise HTTPException(status_code=402, detail=external_msg)
        raise HTTPException(status_code=403, detail=external_msg)
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
        error_msg = str(e)
        external_msg = _extract_external_error_message(error_msg)
        if "trial access has expired" in external_msg.lower():
            raise HTTPException(status_code=402, detail=external_msg)
        if "Invalid request format" in error_msg or "format" in error_msg.lower():
            raise HTTPException(status_code=400, detail=external_msg)
        raise HTTPException(status_code=502, detail=external_msg)
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
        error_msg = str(e)
        external_msg = _extract_external_error_message(error_msg)
        if "trial access has expired" in external_msg.lower():
            raise HTTPException(status_code=402, detail=external_msg)
        if "Invalid request format" in error_msg or "format" in error_msg.lower():
            raise HTTPException(status_code=400, detail=external_msg)
        raise HTTPException(status_code=502, detail=external_msg)
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
        error_msg = str(e)
        if "Invalid request format" in error_msg or "format" in error_msg.lower():
            raise HTTPException(status_code=400, detail=error_msg)
        raise HTTPException(status_code=502, detail=error_msg)
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
    logger.info(
        "Discovery smoke check initiated by user %s",
        getattr(current_user, "email", "anonymous"),
    )
    try:
        discovery_result = await client.discover_creators(
            platform="instagram",
            filters={},
            limit=1,
            page=1,
        )
        account_count = len(discovery_result.get("accounts", []) or [])
        return {
            "api_key_present": bool(_get_influencers_club_api_key()),
            "remote_call_ok": True,
            "message": f"Discovery smoke test passed with {account_count} account(s).",
        }
    except Exception as e:
        logger.warning("Discovery smoke test failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Discovery smoke test failed: {str(e)}")


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


@router.get(
    "/credits/external",
    summary="Get external Influencers Club credit balance",
    tags=["credits"]
)
async def get_external_credits(
    current_user: User = Depends(require_discovery_read),
    client = Depends(get_ic_client)
):
    """
    Get credit balance from Influencers Club API account associated with the configured API key.
    This is separate from internal app credit tracking.
    """
    try:
        credits = await client.get_credits()
        available = float(credits.get("available_credits", 0) or 0)
        used = float(credits.get("used_credits", 0) or 0)
        return {
            "provider": "influencers_club",
            "available_credits": available,
            "used_credits": used,
            "total_credits": available + used,
        }
    except ValueError as e:
        error_msg = str(e)
        external_msg = _extract_external_error_message(error_msg)
        if "Credits endpoint not available" in external_msg:
            raise HTTPException(status_code=501, detail=external_msg)
        if "trial access has expired" in external_msg.lower():
            raise HTTPException(status_code=402, detail=external_msg)
        raise HTTPException(status_code=502, detail=external_msg)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting external credits: {type(e).__name__}: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch external credit balance")


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
