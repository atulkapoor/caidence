"""
SocialAuthService — OAuth2 flows for 6 social platforms.

Supports: Instagram, YouTube (Google), Facebook, LinkedIn, WhatsApp, Snapchat
"""
import json
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional
from urllib.parse import urlencode

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.models.social import SocialConnection

# OAuth configuration per platform
PLATFORM_CONFIG: Dict[str, dict] = {
    "instagram": {
        "auth_url": "https://api.instagram.com/oauth/authorize",
        "token_url": "https://api.instagram.com/oauth/access_token",
        "profile_url": "https://graph.instagram.com/me",
        "profile_params": {"fields": "id,username"},
        "scopes": "instagram_basic,instagram_manage_insights,instagram_content_publish",
        "client_id_attr": "INSTAGRAM_CLIENT_ID",
        "client_secret_attr": "INSTAGRAM_CLIENT_SECRET",
        "username_key": "username",
    },
    "facebook": {
        "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
        "profile_url": "https://graph.facebook.com/me",
        "profile_params": {"fields": "id,name,email"},
        "scopes": "pages_manage_posts,pages_read_engagement,leads_retrieval",
        "client_id_attr": "FACEBOOK_APP_ID",
        "client_secret_attr": "FACEBOOK_APP_SECRET",
        "username_key": "name",
    },
    "youtube": {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "profile_url": "https://www.googleapis.com/youtube/v3/channels",
        "profile_params": {"part": "snippet", "mine": "true"},
        "scopes": "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload",
        "client_id_attr": "GOOGLE_CLIENT_ID",
        "client_secret_attr": "GOOGLE_CLIENT_SECRET",
        "username_key": "snippet.title",
        "extra_auth_params": {"access_type": "offline", "prompt": "consent"},
    },
    "linkedin": {
        "auth_url": "https://www.linkedin.com/oauth/v2/authorization",
        "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
        "profile_url": "https://api.linkedin.com/v2/userinfo",
        "profile_params": {},
        "scopes": "openid profile email w_member_social",
        "client_id_attr": "LINKEDIN_CLIENT_ID",
        "client_secret_attr": "LINKEDIN_CLIENT_SECRET",
        "username_key": "name",
    },
    "whatsapp": {
        "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
        "profile_url": "https://graph.facebook.com/v18.0/me",
        "profile_params": {"fields": "id,name"},
        "scopes": "whatsapp_business_management,whatsapp_business_messaging",
        "client_id_attr": "WHATSAPP_APP_ID",
        "client_secret_attr": "WHATSAPP_APP_SECRET",
        "username_key": "name",
    },
    "snapchat": {
        "auth_url": "https://accounts.snapchat.com/accounts/oauth2/auth",
        "token_url": "https://accounts.snapchat.com/accounts/oauth2/token",
        "profile_url": "https://adsapi.snapchat.com/v1/me",
        "profile_params": {},
        "scopes": "snapchat-marketing-api",
        "client_id_attr": "SNAPCHAT_CLIENT_ID",
        "client_secret_attr": "SNAPCHAT_CLIENT_SECRET",
        "username_key": "me.display_name",
    },
}

VALID_PLATFORMS = list(PLATFORM_CONFIG.keys())

# In-memory OAuth state store (use Redis in production for multi-instance deploys)
_oauth_states: Dict[str, Dict] = {}


class SocialAuthService:
    """Handles OAuth2 flows for social platform connections."""

    @staticmethod
    def get_authorization_url(platform: str, user_id: int) -> str:
        """Build OAuth authorization URL with CSRF state parameter."""
        if platform not in PLATFORM_CONFIG:
            raise ValueError(f"Unsupported platform: {platform}")

        config = PLATFORM_CONFIG[platform]
        state = secrets.token_urlsafe(32)
        _oauth_states[state] = {
            "user_id": user_id,
            "platform": platform,
            "created_at": datetime.utcnow().isoformat(),
        }

        client_id = getattr(settings, config["client_id_attr"])
        redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/{platform}"

        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": config["scopes"],
            "response_type": "code",
            "state": state,
        }

        # Add platform-specific params (e.g., Google's access_type=offline)
        if "extra_auth_params" in config:
            params.update(config["extra_auth_params"])

        return f"{config['auth_url']}?{urlencode(params)}"

    @staticmethod
    async def handle_callback(
        platform: str,
        code: str,
        state: str,
        db: AsyncSession,
    ) -> SocialConnection:
        """Exchange authorization code for tokens, fetch profile, upsert SocialConnection."""
        # Validate state
        state_data = _oauth_states.pop(state, None)
        if not state_data:
            raise ValueError("Invalid or expired OAuth state")

        if state_data["platform"] != platform:
            raise ValueError("Platform mismatch in OAuth state")

        config = PLATFORM_CONFIG[platform]
        client_id = getattr(settings, config["client_id_attr"])
        client_secret = getattr(settings, config["client_secret_attr"])
        redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/{platform}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Exchange code for tokens
            token_payload = {
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            }

            token_resp = await client.post(config["token_url"], data=token_payload)
            if token_resp.status_code != 200:
                raise ValueError(f"Token exchange failed: {token_resp.text}")

            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token")
            expires_in = token_data.get("expires_in", 3600)

            if not access_token:
                raise ValueError("No access_token in response")

            # Fetch user profile from platform
            profile_params = dict(config.get("profile_params", {}))
            profile_resp = await client.get(
                config["profile_url"],
                params=profile_params,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            profile_data = profile_resp.json() if profile_resp.status_code == 200 else {}

        # Extract username from profile using the configured key path
        username = _extract_nested(profile_data, config.get("username_key", "name"))
        platform_user_id = str(profile_data.get("id", ""))

        # YouTube has a different profile structure
        if platform == "youtube" and "items" in profile_data:
            items = profile_data["items"]
            if items:
                snippet = items[0].get("snippet", {})
                username = snippet.get("title", "")
                platform_user_id = items[0].get("id", "")

        # Upsert SocialConnection
        user_id = state_data["user_id"]
        result = await db.execute(
            select(SocialConnection).where(
                SocialConnection.user_id == user_id,
                SocialConnection.platform == platform,
            )
        )
        connection = result.scalar_one_or_none()

        if not connection:
            connection = SocialConnection(user_id=user_id, platform=platform)
            db.add(connection)

        connection.access_token = access_token
        connection.refresh_token = refresh_token
        connection.token_expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))
        connection.scopes = config["scopes"]
        connection.platform_user_id = platform_user_id
        connection.platform_username = username or None
        connection.platform_display_name = username or None
        connection.is_active = True
        connection.raw_profile_json = json.dumps(profile_data)

        await db.commit()
        await db.refresh(connection)
        return connection

    @staticmethod
    async def get_connections(user_id: int, db: AsyncSession) -> list[SocialConnection]:
        """List all active social connections for a user."""
        result = await db.execute(
            select(SocialConnection).where(
                SocialConnection.user_id == user_id,
                SocialConnection.is_active == True,  # noqa: E712
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def disconnect(platform: str, user_id: int, db: AsyncSession) -> None:
        """Revoke and deactivate a social connection."""
        result = await db.execute(
            select(SocialConnection).where(
                SocialConnection.user_id == user_id,
                SocialConnection.platform == platform,
            )
        )
        connection = result.scalar_one_or_none()
        if connection:
            connection.is_active = False
            connection.access_token = None
            connection.refresh_token = None
            await db.commit()

    @staticmethod
    async def refresh_token(platform: str, user_id: int, db: AsyncSession) -> Optional[SocialConnection]:
        """Refresh an expired OAuth token."""
        result = await db.execute(
            select(SocialConnection).where(
                SocialConnection.user_id == user_id,
                SocialConnection.platform == platform,
            )
        )
        connection = result.scalar_one_or_none()
        if not connection or not connection.refresh_token:
            return None

        config = PLATFORM_CONFIG[platform]
        client_id = getattr(settings, config["client_id_attr"])
        client_secret = getattr(settings, config["client_secret_attr"])

        async with httpx.AsyncClient(timeout=30.0) as client:
            token_resp = await client.post(
                config["token_url"],
                data={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "refresh_token": connection.refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            if token_resp.status_code != 200:
                return None

            token_data = token_resp.json()
            connection.access_token = token_data.get("access_token")
            if token_data.get("refresh_token"):
                connection.refresh_token = token_data["refresh_token"]
            expires_in = token_data.get("expires_in", 3600)
            connection.token_expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))

            await db.commit()
            await db.refresh(connection)
            return connection


def _extract_nested(data: dict, key_path: str) -> Optional[str]:
    """Extract a value from nested dict using dot-notation key path."""
    keys = key_path.split(".")
    current = data
    for key in keys:
        if isinstance(current, dict):
            current = current.get(key)
        else:
            return None
    return str(current) if current is not None else None
