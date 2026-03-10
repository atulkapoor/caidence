"""
Modash Discovery API client for creator search and dictionary lookups.
"""

from __future__ import annotations

import logging
from typing import Optional, Dict, Any, List

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://api.modash.io/v1"


class ModashClient:
    def __init__(self, api_key: str, timeout: int = 30):
        self.api_key = api_key
        self.timeout = timeout
        self.client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=timeout,
            follow_redirects=True,
        )

    async def close(self):
        await self.client.aclose()

    async def _request(
        self,
        method: str,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        url = f"{BASE_URL}/{path.lstrip('/')}"
        logger.debug("Modash API request: %s %s", method, url)
        try:
            resp = await self.client.request(method, url, json=json, params=params)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            logger.error("Modash API error %s: %s", e.response.status_code, e.response.text)
            raise ValueError(f"Modash API error {e.response.status_code}: {e.response.text}") from e
        except httpx.RequestError as e:
            logger.error("Modash API request error: %s", e)
            raise ValueError(f"Modash API request failed: {e}") from e

    async def search_creators(
        self,
        platform: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Perform a discovery search for a specific platform.
        Expected platform: instagram | tiktok | youtube
        """
        endpoint = f"{platform}/search"
        return await self._request("POST", endpoint, json=payload)

    async def get_locations(self, platform: str) -> List[Dict[str, Any]]:
        """
        Fetch available locations for the given platform.
        """
        endpoint = f"{platform}/locations"
        resp = await self._request("GET", endpoint)
        # Modash may wrap list in `data`
        data = resp.get("data", resp)
        return data if isinstance(data, list) else []


async def get_modash_client(api_key: str) -> ModashClient:
    return ModashClient(api_key)
