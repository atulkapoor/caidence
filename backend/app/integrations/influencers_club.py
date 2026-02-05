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
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
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
        
        try:
            response = await self.client.request(
                method,
                url,
                json=json,
                params=params,
            )
            response.raise_for_status()
            return response.json()
        
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:  # Rate limited
                logger.warning("API rate limit hit, retrying...")
                raise
            elif e.response.status_code == 401:
                logger.error("Invalid API key")
                raise ValueError("Invalid Influencers Club API key") from e
            elif e.response.status_code == 403:
                logger.error("Insufficient permissions")
                raise PermissionError("Insufficient permissions for this operation") from e
            else:
                logger.error(f"API error: {e.response.status_code} - {e.response.text}")
                raise
    
    async def discover_creators(
        self,
        platform: str,
        filters: Dict[str, Any],
        limit: int = 20,
        offset: int = 0,
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
        
        payload = {
            "platform": platform,
            "limit": limit,
            "offset": offset,
            **filters  # Merge filter criteria
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
        
        return {
            "available_credits": response.get("credits_available", 0),
            "used_credits": response.get("credits_used", 0),
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


async def get_influencers_client(api_key: str) -> InfluencersClubClient:
    """Factory function to create an async client with proper cleanup."""
    return InfluencersClubClient(api_key)
