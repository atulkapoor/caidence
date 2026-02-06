"""
Influencers Club API client for creator discovery and enrichment.
Handles authentication, requests, rate limiting, and data transformation.
"""

import httpx
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

# API Configuration
BASE_URL = "https://api-dashboard.influencers.club"
API_VERSION = "public/v1"
RATE_LIMIT_REQUESTS = 300  # per minute
RATE_LIMIT_RESET = 60  # seconds


class InfluencersClubClient:
    """
    Client for interacting with Influencers Club API.
    
    Supports:
    - Creator discovery with advanced filtering
    - Creator profile enrichment (by handle or email)
    - Post data and engagement metrics
    - Credit usage tracking
    """
    
    def __init__(self, api_key: str, timeout: int = 30):
        """
        Initialize the Influencers Club client.
        
        Args:
            api_key: Bearer token for authentication
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.timeout = timeout
        self.base_url = f"{BASE_URL}/{API_VERSION}"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        self.client = httpx.AsyncClient(
            headers=self.headers,
            timeout=timeout,
            verify=True
        )
        self.request_count = 0
        self.last_reset = datetime.now()
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def _check_rate_limit(self):
        """Check and enforce rate limiting."""
        now = datetime.now()
        time_elapsed = (now - self.last_reset).total_seconds()
        
        if time_elapsed >= RATE_LIMIT_RESET:
            self.request_count = 0
            self.last_reset = now
        
        if self.request_count >= RATE_LIMIT_REQUESTS:
            sleep_time = RATE_LIMIT_RESET - time_elapsed
            logger.warning(f"Rate limit reached. Sleeping for {sleep_time} seconds")
            await asyncio.sleep(max(sleep_time, 0.1))
            self.request_count = 0
            self.last_reset = datetime.now()
        
        self.request_count += 1
    
    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=5)
    )
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        json: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make an API request with retry logic and error handling.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            json: Request body (for POST requests)
            params: Query parameters
        
        Returns:
            Response JSON data
        
        Raises:
            httpx.HTTPError: If request fails after retries
        """
        await self._check_rate_limit()
        
        url = f"{self.base_url}/{endpoint}"
        logger.debug(f"API Request: {method} {url} with payload: {json}")
        
        try:
            response = await self.client.request(
                method,
                url,
                json=json,
                params=params,
            )
            response.raise_for_status()
            data = response.json()
            logger.debug(f"API Response: {method} {url} returned {len(str(data))} chars")
            return data
        
        except httpx.HTTPStatusError as e:
            error_text = e.response.text
            logger.error(f"API error: {method} {endpoint} returned {e.response.status_code}. Response: {error_text}")
            
            if e.response.status_code == 429:  # Rate limited
                logger.warning("API rate limit hit, retrying...")
                raise
            elif e.response.status_code == 401:
                raise ValueError(f"Invalid Influencers Club API key: {error_text}") from e
            elif e.response.status_code == 403:
                raise PermissionError(f"Insufficient permissions: {error_text}") from e
            elif e.response.status_code == 400:
                # Likely a payload format issue
                logger.error(f"Bad request (400). Payload: {json}")
                raise ValueError(f"Invalid request format: {error_text}") from e
            else:
                raise ValueError(f"API error {e.response.status_code}: {error_text}") from e
        
        except httpx.RequestError as e:
            logger.error(f"Network request error: {str(e)}")
            raise ValueError(f"Failed to connect to API: {str(e)}") from e
    
    async def discover_creators(
        self,
        platform: str,
        filters: Dict[str, Any],
        limit: int = 20,
        page: int = 1,
    ) -> Dict[str, Any]:
        """
        Discover creators with advanced filtering.
        
        Args:
            platform: Social platform (instagram, tiktok, youtube, onlyfans, twitter, twitch)
            filters: Filter criteria (follower_count, engagement_percent, keywords, location, etc.)
            limit: Number of results (1-50)
            offset: Pagination offset
        
        Returns:
            Discovery results with creator profiles
        """
        limit = min(max(limit, 1), 50)  # Enforce 1-50 range
        # API expects a `paging` object with `limit` and `page`
        page = max(1, int(page or 1))

        payload = {
            "platform": platform,
            "filters": (filters or {}),
            "paging": {"limit": limit, "page": page},
        }
        
        logger.info(f"Discovering creators on {platform} with filters: {filters}")
        
        response = await self._make_request(
            "POST",
            "discovery/",
            json=payload,
        )
        
        return response
    
    async def enrich_handle(
        self,
        handle: str,
        platform: str,
        enrichment_mode: str = "full",
        email_required: str = "preferred",
    ) -> Dict[str, Any]:
        """
        Enrich creator profile by social media handle.
        
        Args:
            handle: Creator username/handle
            platform: Social platform (instagram, tiktok, youtube, etc.)
            enrichment_mode: 'raw' (0.03 credits) or 'full' (1 credit)
            email_required: 'preferred' or 'must_have'
        
        Returns:
            Enriched creator profile data
        """
        endpoint = "creators/enrich/handle/full" if enrichment_mode == "full" else "creators/enrich/handle/raw"
        
        payload = {
            "handle": handle,
            "platform": platform,
            "email_required": email_required,
        }
        
        logger.info(f"Enriching handle {handle} on {platform} ({enrichment_mode} mode)")
        
        response = await self._make_request(
            "POST",
            endpoint,
            json=payload,
        )
        
        return response

        # Backwards-compatible alias expected by API routes
        async def enrich_creator_handle(self, platform: str, handle: str, enrichment_mode: str = "full") -> Dict[str, Any]:
            return await self.enrich_handle(handle=handle, platform=platform, enrichment_mode=enrichment_mode)
    
    async def enrich_email(
        self,
        email: str,
        enrichment_mode: str = "advanced",
        min_followers: int = 1000,
        exclude_platforms: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Enrich creator profile by email address.
        
        Args:
            email: Creator email address
            enrichment_mode: 'basic' (0.1 credits) or 'advanced' (2 credits)
            min_followers: Minimum follower count filter
            exclude_platforms: Platforms to exclude from results
        
        Returns:
            Enriched creator profile data
        """
        endpoint = "creators/enrich/email/advanced" if enrichment_mode == "advanced" else "creators/enrich/email"
        
        payload = {
            "email": email,
            "min_followers": min_followers,
        }
        
        if exclude_platforms:
            payload["exclude_platforms"] = ",".join(exclude_platforms)
        
        logger.info(f"Enriching email {email} ({enrichment_mode} mode)")
        
        response = await self._make_request(
            "POST",
            endpoint,
            json=payload,
        )
        
        return response
    
    async def get_post_details(
        self,
        platform: str,
        post_id: str,
        content_type: str = "data",
        pagination_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get detailed metrics for a specific social media post.
        
        Args:
            platform: Social platform (instagram, tiktok, youtube)
            post_id: Unique post identifier
            content_type: 'data', 'comments', 'transcript', or 'audio'
            pagination_token: Token for fetching additional data
        
        Returns:
            Post details and engagement metrics
        """
        payload = {
            "platform": platform,
            "post_id": post_id,
            "content_type": content_type,
        }
        
        if pagination_token:
            payload["pagination_token"] = pagination_token
        
        logger.info(f"Fetching post details for {post_id} on {platform}")
        
        response = await self._make_request(
            "POST",
            "creators/content/details/",
            json=payload,
        )
        
        return response
    
    async def get_credits(self) -> Dict[str, Any]:
        """
        Check API credit balance and usage.
        
        Returns:
            Dictionary with available_credits and used_credits
        """
        logger.info("Fetching API credit balance")
        
        response = await self._make_request("GET", "")

        # Extract credits from response, handling multiple possible field names
        available = next(
            (response.get(key) for key in ["credits_available", "available_credits", "balance"]),
            0
        )
        used = next(
            (response.get(key) for key in ["credits_used", "used_credits", "consumed"]),
            0
        )
        
        return {
            "available_credits": available,
            "used_credits": used,
        }
    
    async def batch_enrich_handles(
        self,
        handles: List[str],
        platform: str,
        enrichment_mode: str = "full",
    ) -> List[Dict[str, Any]]:
        """
        Enrich multiple handles in parallel.
        
        Args:
            handles: List of creator handles
            platform: Social platform
            enrichment_mode: Enrichment detail level
        
        Returns:
            List of enriched profiles
        """
        tasks = [
            self.enrich_handle(handle, platform, enrichment_mode)
            for handle in handles
        ]
        
        logger.info(f"Batch enriching {len(handles)} handles on {platform}")
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return [
            result for result in results
            if not isinstance(result, Exception)
        ]
    
    async def search_creators_by_keyword(
        self,
        platform: str,
        keyword: str,
        follower_min: int = 1000,
        follower_max: Optional[int] = None,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """
        Convenience method: Search for creators using AI keyword search.
        
        Args:
            platform: Social platform
            keyword: AI search query (e.g., "fitness influencers")
            follower_min: Minimum follower count
            follower_max: Maximum follower count
            limit: Number of results
        
        Returns:
            Discovery results
        """
        filters = {
            "ai_keywords": keyword,
            "number_of_followers": {
                "min": follower_min,
            }
        }
        
        if follower_max:
            filters["number_of_followers"]["max"] = follower_max
        
        return await self.discover_creators(
            platform=platform,
            filters=filters,
            limit=limit,
        )
    
    async def search_creators_by_engagement(
        self,
        platform: str,
        min_engagement: float = 1.0,
        min_followers: int = 10000,
        location: Optional[List[str]] = None,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """
        Convenience method: Search for high-engagement creators.
        
        Args:
            platform: Social platform
            min_engagement: Minimum engagement rate (%)
            min_followers: Minimum follower count
            location: Geographic location filter
            limit: Number of results
        
        Returns:
            Discovery results
        """
        filters = {
            "engagement_percent": {"min": min_engagement},
            "number_of_followers": {"min": min_followers},
        }
        
        if location:
            filters["location"] = location
        
        return await self.discover_creators(
            platform=platform,
            filters=filters,
            limit=limit,
        )

    async def find_similar_creators(
        self,
        platform: str,
        filter_key: str,
        filter_value: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 20,
        page: int = 1,
    ) -> Dict[str, Any]:
        """Find creators similar to a reference creator. This uses discovery with a reference filter."""
        merged_filters = {**(filters or {}), filter_key: filter_value}
        return await self.discover_creators(platform=platform, filters=merged_filters, limit=limit, page=page)

    # Classifier helpers used by endpoints
    async def get_languages(self) -> List[str]:
        resp = await self._make_request("GET", "classifiers/languages")
        return resp.get("languages", resp.get("data", []))

    async def get_locations(self, platform: str) -> List[str]:
        resp = await self._make_request("GET", f"classifiers/locations/{platform}")
        return resp.get("locations", resp.get("data", []))

    async def get_youtube_topics(self) -> List[str]:
        resp = await self._make_request("GET", "classifiers/yt-topics")
        return resp.get("topics", resp.get("data", []))

    async def get_twitch_games(self) -> List[str]:
        resp = await self._make_request("GET", "classifiers/twitch-games")
        return resp.get("games", resp.get("data", []))


async def get_influencers_client(api_key: str) -> InfluencersClubClient:
    """Factory function to create an async client with proper cleanup."""
    return InfluencersClubClient(api_key)
