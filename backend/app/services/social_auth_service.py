"""SocialAuthService - OAuth2 flows for supported social platforms.

Supports: Instagram, YouTube (Google), Facebook, LinkedIn, WhatsApp, Snapchat
"""

import json
import base64
import secrets
import ipaddress
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from urllib.parse import urlencode, urlparse, unquote

import httpx
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.models.social import SocialConnection

# OAuth configuration per platform
PLATFORM_CONFIG: Dict[str, dict] = {
    "instagram": {
        # Instagram Business/Creator flow goes through Facebook OAuth.
        "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
        "profile_url": "https://graph.facebook.com/me",
        "profile_params": {"fields": "id,name"},
        "scopes": "pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,business_management",
        "client_id_attr": "INSTAGRAM_CLIENT_ID",
        "client_secret_attr": "INSTAGRAM_CLIENT_SECRET",
        "username_key": "name",
    },
    "facebook": {
        "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
        "profile_url": "https://graph.facebook.com/me",
        "profile_params": {"fields": "id,name,email"},
        "scopes": "pages_show_list,pages_read_engagement,pages_manage_posts",
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
        "scopes": "whatsapp_business_management,whatsapp_business_messaging,business_management",
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

# Ensure .env is loaded for direct env access in this module.
_backend_root = Path(__file__).resolve().parents[2]
load_dotenv(str(_backend_root / ".env"))

# In-memory OAuth state store (use Redis in production for multi-instance deploys)
_oauth_states: Dict[str, Dict] = {}


class SocialAuthService:
    """Handles OAuth2 flows for social platform connections."""

    @staticmethod
    def _resolve_client_id(platform: str, client_id_attr: str) -> str:
        """Resolve OAuth client id with Instagram fallback to Facebook app id."""
        if platform == "whatsapp":
            client_id = os.getenv(client_id_attr, "")
        else:
            client_id = getattr(settings, client_id_attr, "")
        if platform == "instagram" and not client_id:
            client_id = settings.FACEBOOK_APP_ID
        return client_id or ""

    @staticmethod
    def _resolve_client_secret(platform: str, client_secret_attr: str) -> str:
        """Resolve OAuth client secret with Instagram fallback to Facebook app secret."""
        if platform == "whatsapp":
            client_secret = os.getenv(client_secret_attr, "")
        else:
            client_secret = getattr(settings, client_secret_attr, "")
        if platform == "instagram" and not client_secret:
            client_secret = settings.FACEBOOK_APP_SECRET
        return client_secret or ""

    @staticmethod
    def get_authorization_url(
        platform: str,
        user_id: int,
        redirect_to: Optional[str] = None,
        brand_id: Optional[int] = None,
    ) -> str:
        """Build OAuth authorization URL with CSRF state parameter."""
        if platform not in PLATFORM_CONFIG:
            raise ValueError(f"Unsupported platform: {platform}")

        config = PLATFORM_CONFIG[platform]
        state = secrets.token_urlsafe(32)
        redirect_target = SocialAuthService._sanitize_redirect_to(redirect_to)
        _oauth_states[state] = {
            "user_id": user_id,
            "platform": platform,
            "redirect_to": redirect_target,
            "brand_id": brand_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        client_id = SocialAuthService._resolve_client_id(platform, config["client_id_attr"])
        if not client_id:
            required = config["client_id_attr"]
            if platform == "instagram":
                required = "INSTAGRAM_CLIENT_ID (or FACEBOOK_APP_ID)"
            raise ValueError(
                f"Missing OAuth client id for {platform}. "
                f"Set {required} in backend .env and restart backend."
            )
        redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/{platform}"

        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": config["scopes"],
            "response_type": "code",
            "state": state,
        }

        if "extra_auth_params" in config:
            params.update(config["extra_auth_params"])

        return f"{config['auth_url']}?{urlencode(params)}"

    @staticmethod
    def _sanitize_redirect_to(redirect_to: Optional[str]) -> str:
        """Allow only relative frontend paths to prevent open redirects."""
        default_path = "/settings?tab=social"
        if not redirect_to:
            return default_path

        candidate = unquote(str(redirect_to)).strip()
        if not candidate.startswith("/"):
            return default_path
        if candidate.startswith("//") or "://" in candidate:
            return default_path
        return candidate

    @staticmethod
    async def handle_callback(
        platform: str,
        code: str,
        state: str,
        db: AsyncSession,
    ) -> tuple[SocialConnection, str]:
        """Exchange authorization code for tokens, fetch profile, upsert SocialConnection."""
        state_data = _oauth_states.pop(state, None)
        if not state_data:
            raise ValueError("Invalid or expired OAuth state")

        if state_data["platform"] != platform:
            raise ValueError("Platform mismatch in OAuth state")

        config = PLATFORM_CONFIG[platform]
        client_id = SocialAuthService._resolve_client_id(platform, config["client_id_attr"])
        client_secret = SocialAuthService._resolve_client_secret(platform, config["client_secret_attr"])
        if not client_id:
            required = config["client_id_attr"]
            if platform == "instagram":
                required = "INSTAGRAM_CLIENT_ID (or FACEBOOK_APP_ID)"
            raise ValueError(
                f"Missing OAuth client id for {platform}. "
                f"Set {required} in backend .env and restart backend."
            )
        if not client_secret:
            required = config["client_secret_attr"]
            if platform == "instagram":
                required = "INSTAGRAM_CLIENT_SECRET (or FACEBOOK_APP_SECRET)"
            raise ValueError(
                f"Missing OAuth client secret for {platform}. "
                f"Set {required} in backend .env and restart backend."
            )
        redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/{platform}"

        async with httpx.AsyncClient(timeout=30.0) as client:
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

            profile_params = dict(config.get("profile_params", {}))
            profile_resp = await client.get(
                config["profile_url"],
                params=profile_params,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            profile_data = profile_resp.json() if profile_resp.status_code == 200 else {}

            facebook_pages: list[dict[str, str]] = []
            if platform == "facebook":
                facebook_pages = await SocialAuthService._fetch_facebook_pages(client, access_token)
            instagram_accounts: list[dict[str, str]] = []
            if platform == "instagram":
                instagram_accounts = await SocialAuthService._fetch_instagram_business_accounts(client, access_token)
                if not instagram_accounts:
                    raise ValueError(
                        "No Instagram Business/Creator account found on your Facebook Pages. "
                        "Connect Instagram to a Facebook Page in Meta first."
                    )
            whatsapp_phones: list[dict[str, str]] = []
            if platform == "whatsapp":
                whatsapp_phones = await SocialAuthService._fetch_whatsapp_phone_numbers(client, access_token)
                if not whatsapp_phones:
                    raise ValueError(
                        "No WhatsApp Business phone numbers found. "
                        "Ensure your Meta Business has a WhatsApp Business Account with an active phone number."
                    )

        username = _extract_nested(profile_data, config.get("username_key", "name"))
        platform_user_id = str(profile_data.get("id", ""))

        if platform == "youtube" and "items" in profile_data:
            items = profile_data["items"]
            if items:
                snippet = items[0].get("snippet", {})
                username = snippet.get("title", "")
                platform_user_id = items[0].get("id", "")

        # LinkedIn userinfo commonly returns `sub` (OpenID subject) instead of `id`.
        if platform == "linkedin":
            first = profile_data.get("localizedFirstName") or profile_data.get("given_name") or ""
            last = profile_data.get("localizedLastName") or profile_data.get("family_name") or ""
            platform_user_id = str(profile_data.get("id") or profile_data.get("sub") or "")
            username = f"{first} {last}".strip() or profile_data.get("name") or username

        if platform == "instagram":
            selected_instagram = instagram_accounts[0]
            platform_user_id = selected_instagram.get("instagram_business_id", "") or platform_user_id
            username = selected_instagram.get("instagram_username", "") or username
        if platform == "whatsapp" and whatsapp_phones:
            selected_phone = whatsapp_phones[0]
            platform_user_id = selected_phone.get("phone_number_id", "") or platform_user_id
            username = (
                selected_phone.get("display_phone_number", "")
                or selected_phone.get("verified_name", "")
                or username
            )

        # Upsert SocialConnection
        user_id = state_data["user_id"]
        brand_id = state_data.get("brand_id")
        result = await db.execute(
            select(SocialConnection).where(
                SocialConnection.user_id == user_id,
                SocialConnection.platform == platform,
                SocialConnection.brand_id == brand_id if brand_id is not None else SocialConnection.brand_id.is_(None),
            )
        )
        connection = result.scalar_one_or_none()

        if not connection:
            connection = SocialConnection(user_id=user_id, platform=platform, brand_id=brand_id)
            db.add(connection)

        connection.access_token = access_token
        connection.refresh_token = refresh_token
        connection.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
        connection.scopes = config["scopes"]
        connection.platform_user_id = platform_user_id
        connection.platform_username = username or None
        connection.platform_display_name = username or None
        connection.is_active = True
        raw_profile_payload = {
            "profile": profile_data,
            "facebook_pages": facebook_pages if platform == "facebook" else [],
            "instagram_accounts": instagram_accounts if platform == "instagram" else [],
            "selected_instagram_account": instagram_accounts[0] if platform == "instagram" and instagram_accounts else None,
            "whatsapp_phone_numbers": whatsapp_phones if platform == "whatsapp" else [],
            "selected_whatsapp_phone": whatsapp_phones[0] if platform == "whatsapp" and whatsapp_phones else None,
        }
        connection.raw_profile_json = json.dumps(raw_profile_payload)

        await db.commit()
        await db.refresh(connection)
        redirect_to = SocialAuthService._sanitize_redirect_to(state_data.get("redirect_to"))
        return connection, redirect_to

    @staticmethod
    async def get_connection(
        platform: str,
        user_id: int,
        db: AsyncSession,
        brand_id: Optional[int] = None,
    ) -> Optional[SocialConnection]:
        """Get a single active social connection by platform for a user."""
        result = await db.execute(
            select(SocialConnection).where(
                SocialConnection.user_id == user_id,
                SocialConnection.platform == platform,
                SocialConnection.brand_id == brand_id if brand_id is not None else SocialConnection.brand_id.is_(None),
                SocialConnection.is_active == True,  # noqa: E712
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_connections(
        user_id: int,
        db: AsyncSession,
        brand_id: Optional[int] = None,
    ) -> list[SocialConnection]:
        """List all active social connections for a user."""
        result = await db.execute(
            select(SocialConnection).where(
                SocialConnection.user_id == user_id,
                SocialConnection.brand_id == brand_id if brand_id is not None else SocialConnection.brand_id.is_(None),
                SocialConnection.is_active == True,  # noqa: E712
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def disconnect(
        platform: str,
        user_id: int,
        db: AsyncSession,
        brand_id: Optional[int] = None,
    ) -> None:
        """Revoke and deactivate a social connection."""
        result = await db.execute(
            select(SocialConnection).where(
                SocialConnection.user_id == user_id,
                SocialConnection.platform == platform,
                SocialConnection.brand_id == brand_id if brand_id is not None else SocialConnection.brand_id.is_(None),
            )
        )
        connection = result.scalar_one_or_none()
        if connection:
            connection.is_active = False
            connection.access_token = None
            connection.refresh_token = None
            await db.commit()

    @staticmethod
    async def refresh_token(
        platform: str,
        user_id: int,
        db: AsyncSession,
        brand_id: Optional[int] = None,
    ) -> Optional[SocialConnection]:
        """Refresh an expired OAuth token."""
        result = await db.execute(
            select(SocialConnection).where(
                SocialConnection.user_id == user_id,
                SocialConnection.platform == platform,
                SocialConnection.brand_id == brand_id if brand_id is not None else SocialConnection.brand_id.is_(None),
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
            connection.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))

            await db.commit()
            await db.refresh(connection)
            return connection

    @staticmethod
    def _get_selected_whatsapp_phone(connection: SocialConnection) -> Optional[dict]:
        """Return selected WhatsApp phone metadata from raw profile payload."""
        if not connection or not connection.raw_profile_json:
            return None
        try:
            payload = json.loads(connection.raw_profile_json or "{}")
        except Exception:
            return None
        selected = payload.get("selected_whatsapp_phone")
        if isinstance(selected, dict) and str(selected.get("phone_number_id") or "").strip():
            return selected
        phones = payload.get("whatsapp_phone_numbers")
        if isinstance(phones, list) and phones:
            candidate = phones[0]
            if isinstance(candidate, dict):
                return candidate
        return None

    @staticmethod
    async def publish_whatsapp_messages(
        user_id: int,
        db: AsyncSession,
        to_numbers: list[str],
        message: Optional[str] = None,
        template: Optional[dict] = None,
        image_url: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
        brand_id: Optional[int] = None,
    ) -> dict:
        """Send WhatsApp messages to multiple recipients using selected phone number."""
        connection = await SocialAuthService.get_connection("whatsapp", user_id, db, brand_id=brand_id)
        if not connection or not connection.access_token:
            raise ValueError("WhatsApp is not connected for this user")

        selected_phone = SocialAuthService._get_selected_whatsapp_phone(connection)
        if not selected_phone:
            raise ValueError("No WhatsApp phone number selected. Reconnect WhatsApp or select a phone number.")

        phone_number_id = str(selected_phone.get("phone_number_id") or "").strip()
        if not phone_number_id:
            raise ValueError("Selected WhatsApp phone number is missing phone_number_id")

        # Resolve media payload if provided.
        media_payload: Optional[dict] = None
        if image_url and image_bytes:
            raise ValueError("Provide either image_url or image_bytes, not both")

        if image_url:
            if not image_url.startswith(("http://", "https://")):
                raise ValueError("WhatsApp image_url must be a public http/https URL")
            media_payload = {"type": "image", "image": {"link": image_url}}
        elif image_bytes:
            media_id = await SocialAuthService._upload_whatsapp_media(
                phone_number_id=phone_number_id,
                access_token=connection.access_token,
                image_bytes=image_bytes,
            )
            media_payload = {"type": "image", "image": {"id": media_id}}

        if not template and not message and not media_payload:
            raise ValueError("WhatsApp message text, template, or media is required")

        results: list[dict] = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            for to in to_numbers:
                recipient = str(to or "").strip()
                if not recipient:
                    continue

                payload: dict = {
                    "messaging_product": "whatsapp",
                    "to": recipient,
                }

                if template:
                    payload.update(
                        {
                            "type": "template",
                            "template": template,
                        }
                    )
                elif media_payload:
                    payload.update(media_payload)
                    if message:
                        payload.setdefault("image", {})["caption"] = message
                else:
                    payload.update(
                        {
                            "type": "text",
                            "text": {"preview_url": False, "body": message or ""},
                        }
                    )

                resp = await client.post(
                    f"https://graph.facebook.com/v18.0/{phone_number_id}/messages",
                    headers={
                        "Authorization": f"Bearer {connection.access_token}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

                if resp.status_code not in (200, 201):
                    results.append(
                        {
                            "to": recipient,
                            "status": "failed",
                            "error": resp.text,
                        }
                    )
                    continue

                data = resp.json()
                results.append(
                    {
                        "to": recipient,
                        "status": "sent",
                        "message_id": (data.get("messages") or [{}])[0].get("id"),
                    }
                )

        return {
            "platform": "whatsapp",
            "status": "sent",
            "phone_number_id": phone_number_id,
            "display_phone_number": selected_phone.get("display_phone_number"),
            "verified_name": selected_phone.get("verified_name"),
            "results": results,
        }

    @staticmethod
    async def _fetch_facebook_pages(client: httpx.AsyncClient, access_token: str) -> list[dict[str, str]]:
        """Fetch Facebook pages available for the connected user."""
        try:
            response = await client.get(
                "https://graph.facebook.com/v18.0/me/accounts",
                params={"fields": "id,name,access_token"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if response.status_code != 200:
                return []

            payload = response.json()
            pages: list[dict[str, str]] = []
            for item in payload.get("data", []):
                page_id = str(item.get("id", "")).strip()
                name = str(item.get("name", "")).strip()
                page_access_token = str(item.get("access_token", "")).strip()
                if page_id and name:
                    pages.append(
                        {
                            "id": page_id,
                            "name": name,
                            "access_token": page_access_token,
                        }
                    )
            return pages
        except Exception:
            return []

    @staticmethod
    async def _fetch_instagram_business_accounts(
        client: httpx.AsyncClient,
        access_token: str,
    ) -> list[dict[str, str]]:
        """Fetch Instagram Business/Creator accounts connected to Facebook Pages."""
        try:
            response = await client.get(
                "https://graph.facebook.com/v18.0/me/accounts",
                params={
                    "fields": "id,name,access_token,instagram_business_account{id,username,name},connected_instagram_account{id,username,name}"
                },
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if response.status_code != 200:
                return []

            payload = response.json()
            accounts: list[dict[str, str]] = []
            for item in payload.get("data", []):
                page_id = str(item.get("id", "")).strip()
                page_name = str(item.get("name", "")).strip()
                page_access_token = str(item.get("access_token", "")).strip()

                ig_data = item.get("instagram_business_account") or item.get("connected_instagram_account") or {}
                ig_id = str(ig_data.get("id", "")).strip()
                ig_username = str(ig_data.get("username", "")).strip()
                ig_name = str(ig_data.get("name", "")).strip()

                if page_id and ig_id:
                    accounts.append(
                        {
                            "page_id": page_id,
                            "page_name": page_name,
                            "page_access_token": page_access_token,
                            "instagram_business_id": ig_id,
                            "instagram_username": ig_username,
                            "instagram_name": ig_name or ig_username,
                        }
                    )

            return accounts
        except Exception:
            return []

    @staticmethod
    async def _fetch_meta_businesses(
        client: httpx.AsyncClient,
        access_token: str,
    ) -> list[dict[str, str]]:
        """Fetch Meta business accounts for the connected user."""
        try:
            response = await client.get(
                "https://graph.facebook.com/v18.0/me/businesses",
                params={"fields": "id,name"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if response.status_code != 200:
                return []

            payload = response.json()
            businesses: list[dict[str, str]] = []
            for item in payload.get("data", []):
                biz_id = str(item.get("id", "")).strip()
                name = str(item.get("name", "")).strip()
                if biz_id:
                    businesses.append({"id": biz_id, "name": name})
            return businesses
        except Exception:
            return []

    @staticmethod
    async def _upload_whatsapp_media(
        phone_number_id: str,
        access_token: str,
        image_bytes: bytes,
    ) -> str:
        """Upload media to WhatsApp Cloud API and return media id."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"https://graph.facebook.com/v18.0/{phone_number_id}/media",
                headers={"Authorization": f"Bearer {access_token}"},
                files={
                    "file": ("image.png", image_bytes, "image/png"),
                    "type": (None, "image/png"),
                    "messaging_product": (None, "whatsapp"),
                },
            )
            if resp.status_code not in (200, 201):
                raise ValueError(f"WhatsApp media upload failed: {resp.text}")
            data = resp.json()
            media_id = str(data.get("id") or "").strip()
            if not media_id:
                raise ValueError("WhatsApp media upload did not return a media id")
            return media_id

    @staticmethod
    async def _fetch_whatsapp_business_accounts(
        client: httpx.AsyncClient,
        access_token: str,
    ) -> list[dict[str, str]]:
        """Fetch WhatsApp Business Accounts (WABA) for all Meta businesses."""
        businesses = await SocialAuthService._fetch_meta_businesses(client, access_token)
        wabas: list[dict[str, str]] = []
        for biz in businesses:
            biz_id = str(biz.get("id", "")).strip()
            if not biz_id:
                continue
            try:
                resp = await client.get(
                    f"https://graph.facebook.com/v18.0/{biz_id}/owned_whatsapp_business_accounts",
                    params={"fields": "id,name"},
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if resp.status_code != 200:
                    continue
                payload = resp.json()
                for item in payload.get("data", []):
                    waba_id = str(item.get("id", "")).strip()
                    name = str(item.get("name", "")).strip()
                    if waba_id:
                        wabas.append(
                            {
                                "waba_id": waba_id,
                                "waba_name": name,
                                "business_id": biz_id,
                                "business_name": str(biz.get("name", "")).strip(),
                            }
                        )
            except Exception:
                continue
        return wabas

    @staticmethod
    async def _fetch_whatsapp_phone_numbers(
        client: httpx.AsyncClient,
        access_token: str,
    ) -> list[dict[str, str]]:
        """Fetch phone numbers across all WhatsApp Business Accounts."""
        wabas = await SocialAuthService._fetch_whatsapp_business_accounts(client, access_token)
        phones: list[dict[str, str]] = []
        for waba in wabas:
            waba_id = str(waba.get("waba_id", "")).strip()
            if not waba_id:
                continue
            try:
                resp = await client.get(
                    f"https://graph.facebook.com/v18.0/{waba_id}/phone_numbers",
                    params={"fields": "id,display_phone_number,verified_name,quality_rating,code_verification_status"},
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if resp.status_code != 200:
                    continue
                payload = resp.json()
                for item in payload.get("data", []):
                    phone_id = str(item.get("id", "")).strip()
                    if not phone_id:
                        continue
                    phones.append(
                        {
                            "phone_number_id": phone_id,
                            "display_phone_number": str(item.get("display_phone_number", "")).strip(),
                            "verified_name": str(item.get("verified_name", "")).strip(),
                            "quality_rating": str(item.get("quality_rating", "")).strip(),
                            "code_verification_status": str(item.get("code_verification_status", "")).strip(),
                            "waba_id": waba_id,
                            "waba_name": str(waba.get("waba_name", "")).strip(),
                            "business_id": str(waba.get("business_id", "")).strip(),
                            "business_name": str(waba.get("business_name", "")).strip(),
                        }
                    )
            except Exception:
                continue
        return phones

    @staticmethod
    async def publish_facebook_post(
        user_id: int,
        message: str,
        db: AsyncSession,
        image_url: Optional[str] = None,
        brand_id: Optional[int] = None,
    ) -> dict:
        """Publish a text or image post to a selected Facebook page."""
        connection = await SocialAuthService.get_connection("facebook", user_id, db, brand_id=brand_id)
        if not connection or not connection.access_token:
            raise ValueError("Facebook is not connected for this user")

        raw_payload = {}
        if connection.raw_profile_json:
            try:
                raw_payload = json.loads(connection.raw_profile_json)
            except Exception:
                raw_payload = {}

        selected_page = raw_payload.get("selected_page")
        if not isinstance(selected_page, dict):
            pages = raw_payload.get("facebook_pages")
            if isinstance(pages, list) and pages:
                selected_page = pages[0]

        if not isinstance(selected_page, dict):
            raise ValueError("No Facebook page selected. Select a page first.")

        page_id = str(selected_page.get("id", "")).strip()
        page_name = str(selected_page.get("name", "")).strip() or "Facebook Page"
        page_access_token = str(selected_page.get("access_token", "")).strip()
        if not page_id or not page_access_token:
            raise ValueError("Selected Facebook page is missing id or access token")

        async with httpx.AsyncClient(timeout=30.0) as client:
            if image_url:
                if image_url.startswith(("http://", "https://")):
                    # Prefer byte-upload (`source`) for reliability, because Meta may reject
                    # URLs that are locally hosted, private, or temporarily inaccessible.
                    image_resp = await client.get(image_url, follow_redirects=True)
                    if image_resp.status_code in (200, 201) and image_resp.content:
                        content_type = image_resp.headers.get("content-type", "").split(";")[0].strip() or "image/png"
                        resp = await client.post(
                            f"https://graph.facebook.com/v18.0/{page_id}/photos",
                            data={
                                "caption": message or "",
                                "access_token": page_access_token,
                            },
                            files={"source": ("generated.png", image_resp.content, content_type)},
                        )
                    else:
                        resp = await client.post(
                            f"https://graph.facebook.com/v18.0/{page_id}/photos",
                            data={
                                "caption": message or "",
                                "url": image_url,
                                "access_token": page_access_token,
                            },
                        )
                elif image_url.startswith("data:"):
                    encoded = image_url.split(",", 1)[1] if "," in image_url else image_url
                    try:
                        image_bytes = base64.b64decode(encoded, validate=True)
                    except Exception as exc:  # noqa: BLE001
                        raise ValueError(f"Invalid image data URL: {exc}") from exc

                    resp = await client.post(
                        f"https://graph.facebook.com/v18.0/{page_id}/photos",
                        data={
                            "caption": message or "",
                            "access_token": page_access_token,
                        },
                        files={"source": ("generated.png", image_bytes, "image/png")},
                    )
                else:
                    raise ValueError(
                        "Facebook image must be a data URL or public image URL (http/https)."
                    )
            else:
                resp = await client.post(
                    f"https://graph.facebook.com/v18.0/{page_id}/feed",
                    data={"message": message, "access_token": page_access_token},
                )

            if resp.status_code not in (200, 201):
                raise ValueError(f"Facebook publish failed: {resp.text}")

            data = resp.json()
            return {
                "platform": "facebook",
                "status": "published",
                "post_id": data.get("id"),
                "target_name": page_name,
            }

    @staticmethod
    async def publish_instagram_post(
        user_id: int,
        caption: str,
        image_url: str,
        db: AsyncSession,
        brand_id: Optional[int] = None,
    ) -> dict:
        """Publish an image post to selected Instagram business account."""
        connection = await SocialAuthService.get_connection("instagram", user_id, db, brand_id=brand_id)
        if not connection or not connection.access_token:
            raise ValueError("Instagram is not connected for this user")

        if not image_url or not image_url.startswith(("http://", "https://")):
            raise ValueError("Instagram publishing requires a public image URL (http/https)")

        raw_payload = {}
        if connection.raw_profile_json:
            try:
                raw_payload = json.loads(connection.raw_profile_json)
            except Exception:
                raw_payload = {}

        selected_account = raw_payload.get("selected_instagram_account")
        if not isinstance(selected_account, dict):
            accounts = raw_payload.get("instagram_accounts")
            if isinstance(accounts, list) and accounts:
                selected_account = accounts[0]

        if not isinstance(selected_account, dict):
            raise ValueError("No Instagram business account selected. Reconnect Instagram.")

        ig_business_id = str(selected_account.get("instagram_business_id", "")).strip()
        ig_name = (
            str(selected_account.get("instagram_name", "")).strip()
            or str(selected_account.get("instagram_username", "")).strip()
            or "Instagram"
        )
        publish_token = str(selected_account.get("page_access_token", "")).strip() or connection.access_token

        if not ig_business_id:
            raise ValueError("Selected Instagram account is missing instagram_business_id")

        async with httpx.AsyncClient(timeout=30.0) as client:
            await _validate_instagram_media_url(client, image_url)

            create_container = await client.post(
                f"https://graph.facebook.com/v18.0/{ig_business_id}/media",
                data={
                    "image_url": image_url,
                    "caption": caption or "",
                    "access_token": publish_token,
                },
            )
            if create_container.status_code not in (200, 201):
                raise ValueError(_format_meta_graph_error("Instagram media creation failed", create_container.text))

            container_data = create_container.json()
            creation_id = str(container_data.get("id", "")).strip()
            if not creation_id:
                raise ValueError("Instagram media creation did not return an id")

            publish_resp = await client.post(
                f"https://graph.facebook.com/v18.0/{ig_business_id}/media_publish",
                data={
                    "creation_id": creation_id,
                    "access_token": publish_token,
                },
            )
            if publish_resp.status_code not in (200, 201):
                raise ValueError(_format_meta_graph_error("Instagram publish failed", publish_resp.text))

            publish_data = publish_resp.json()
            return {
                "platform": "instagram",
                "status": "published",
                "post_id": publish_data.get("id"),
                "target_name": ig_name,
            }

    @staticmethod
    async def publish_linkedin_post(
        user_id: int,
        text: str,
        db: AsyncSession,
        visibility: str = "PUBLIC",
        image_bytes: Optional[bytes] = None,
        brand_id: Optional[int] = None,
    ) -> dict:
        """Publish a text/image post to LinkedIn for the authenticated connected user."""
        connection = await SocialAuthService.get_connection("linkedin", user_id, db, brand_id=brand_id)
        if not connection or not connection.access_token:
            raise ValueError("LinkedIn is not connected for this user")

        # Attempt refresh only when token is expired and refresh token is available.
        if connection.token_expires_at and _is_expired(connection.token_expires_at):
            refreshed = await SocialAuthService.refresh_token("linkedin", user_id, db, brand_id=brand_id)
            if refreshed and refreshed.access_token:
                connection = refreshed

        if not connection.platform_user_id:
            raise ValueError("LinkedIn account identifier missing. Reconnect LinkedIn.")

        author_urn = f"urn:li:person:{connection.platform_user_id}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                media_urn = None
                if image_bytes:
                    media_urn = await _upload_linkedin_image(client, connection.access_token, author_urn, image_bytes)

                payload = {
                    "author": author_urn,
                    "lifecycleState": "PUBLISHED",
                    "specificContent": {
                        "com.linkedin.ugc.ShareContent": {
                            "shareCommentary": {"text": text},
                            "shareMediaCategory": "IMAGE" if media_urn else "NONE",
                        }
                    },
                    "visibility": {
                        "com.linkedin.ugc.MemberNetworkVisibility": visibility,
                    },
                }

                if media_urn:
                    payload["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = [
                        {
                            "status": "READY",
                            "media": media_urn,
                        }
                    ]

                resp = await client.post(
                    "https://api.linkedin.com/v2/ugcPosts",
                    headers={
                        "Authorization": f"Bearer {connection.access_token}",
                        "Content-Type": "application/json",
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                    json=payload,
                )
                if resp.status_code not in (200, 201):
                    raise ValueError(f"LinkedIn publish failed: {resp.text}")

                post_id = resp.headers.get("x-restli-id")
                data = _safe_json(resp.text)
                return {
                    "platform": "linkedin",
                    "status": "published",
                    "post_id": post_id or data.get("id"),
                    "author": author_urn,
                    "has_image": bool(media_urn),
                }
        except httpx.HTTPError as exc:
            raise ValueError(f"LinkedIn network error: {exc}") from exc
        except Exception as exc:  # noqa: BLE001
            raise ValueError(f"LinkedIn publish internal error: {exc}") from exc


def _extract_nested(data: dict, key_path: str) -> Optional[str]:
    """Extract a value from nested dict using dot-notation key path."""
    keys = key_path.split(".")
    current: Any = data
    for key in keys:
        if isinstance(current, dict):
            current = current.get(key)
        else:
            return None
    return str(current) if current is not None else None


async def _upload_linkedin_image(
    client: httpx.AsyncClient,
    access_token: str,
    author_urn: str,
    image_bytes: bytes,
) -> str:
    """Register and upload image bytes to LinkedIn, then return media asset URN."""
    register_payload = {
        "registerUploadRequest": {
            "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
            "owner": author_urn,
            "serviceRelationships": [
                {
                    "relationshipType": "OWNER",
                    "identifier": "urn:li:userGeneratedContent",
                }
            ],
        }
    }

    register_resp = await client.post(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        },
        json=register_payload,
    )
    if register_resp.status_code not in (200, 201):
        raise ValueError(f"LinkedIn image register failed: {register_resp.text}")

    register_data = _safe_json(register_resp.text)
    upload_info = (
        register_data.get("value", {})
        .get("uploadMechanism", {})
        .get("com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest", {})
    )
    upload_url = upload_info.get("uploadUrl")
    asset_urn = register_data.get("value", {}).get("asset")

    if not upload_url or not asset_urn:
        raise ValueError("LinkedIn image upload URL or asset URN missing")

    upload_resp = await client.put(
        upload_url,
        content=image_bytes,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/octet-stream",
        },
    )
    if upload_resp.status_code not in (200, 201):
        raise ValueError(f"LinkedIn image upload failed: {upload_resp.text}")

    return asset_urn


def _safe_json(text: str | None) -> dict:
    """Parse a JSON object safely; return empty dict for empty body."""
    if not text:
        return {}
    try:
        parsed = json.loads(text)
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Expected JSON response from LinkedIn, got: {text[:200]}") from exc

    if not isinstance(parsed, dict):
        raise ValueError("Unexpected LinkedIn response format")
    return parsed


def _format_meta_graph_error(prefix: str, raw_text: str) -> str:
    """Return a compact, user-actionable message from Meta Graph error payload."""
    try:
        payload = json.loads(raw_text or "{}")
    except Exception:
        return f"{prefix}: {raw_text}"

    if not isinstance(payload, dict):
        return f"{prefix}: {raw_text}"

    err = payload.get("error")
    if not isinstance(err, dict):
        return f"{prefix}: {raw_text}"

    message = str(err.get("message") or "").strip()
    code = err.get("code")
    subcode = err.get("error_subcode")
    user_title = str(err.get("error_user_title") or "").strip()
    user_msg = str(err.get("error_user_msg") or "").strip()

    if code == 25 and subcode == 2207050:
        return (
            "Instagram account is restricted for API publishing. "
            "Open Instagram Account Status, remove/appeal restrictions, "
            "then reconnect Instagram."
        )
    if code == 9004 and subcode == 2207052:
        return (
            "Instagram could not download your media URL. Use a direct, public image/video URL "
            "(not localhost/private/auth-required page, no HTML redirect/login)."
        )

    detail_parts = [part for part in [user_title, user_msg, message] if part]
    detail = " | ".join(detail_parts) if detail_parts else raw_text
    if code is not None or subcode is not None:
        detail = f"{detail} (code={code}, subcode={subcode})"
    return f"{prefix}: {detail}"


def _is_expired(expires_at: datetime) -> bool:
    """Compare expiry safely across naive/aware datetime values."""
    now_utc = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at <= now_utc


async def _validate_instagram_media_url(client: httpx.AsyncClient, media_url: str) -> None:
    """Validate media URL is remotely reachable by Meta and points to image/video content."""
    parsed = urlparse(media_url)
    host = (parsed.hostname or "").strip().lower()
    if not host:
        raise ValueError("Instagram media URL is missing a valid hostname")
    if host in {"localhost", "127.0.0.1", "0.0.0.0"} or host.endswith(".local"):
        raise ValueError("Instagram cannot fetch localhost/private URLs. Use a public URL.")

    ip = None
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        ip = None
    if ip and (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast):
        raise ValueError("Instagram cannot fetch private IP URLs. Use a public URL.")

    try:
        resp = await client.get(media_url, follow_redirects=True)
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Media URL is unreachable from server: {exc}") from exc

    if resp.status_code < 200 or resp.status_code >= 300:
        raise ValueError(f"Media URL returned HTTP {resp.status_code}. Use a direct public file URL.")

    content_type = (resp.headers.get("content-type") or "").lower()
    if not (content_type.startswith("image/") or content_type.startswith("video/")):
        raise ValueError(
            f"Media URL content-type must be image/* or video/*, got '{content_type or 'unknown'}'."
        )
