"""
CPaaS (Communications Platform as a Service) Integration
Provides real integrations with Twilio (SMS/WhatsApp) and SendGrid (Email).
Falls back to mock mode when API keys are not configured.
"""

import os
import random
import logging
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Optional imports - graceful fallback if not installed
try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    logger.warning("Twilio SDK not installed. SMS/WhatsApp will use mock mode.")

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False
    logger.warning("SendGrid SDK not installed. Email will use mock mode.")


class CPaaSService:
    """
    Communications Platform as a Service.
    Integrates with Twilio (SMS, WhatsApp) and SendGrid (Email).
    Automatically falls back to mock mode if credentials are not set.
    """

    def __init__(self):
        # Twilio Configuration
        self.twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")
        self.twilio_client: Optional[TwilioClient] = None
        
        if TWILIO_AVAILABLE and self.twilio_sid and self.twilio_token:
            try:
                self.twilio_client = TwilioClient(self.twilio_sid, self.twilio_token)
                logger.info("Twilio client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio: {e}")
        
        # SendGrid Configuration
        self.sendgrid_key = os.getenv("SENDGRID_API_KEY")
        self.sendgrid_from = os.getenv("SENDGRID_FROM_EMAIL", "noreply@cadence.ai")
        self.sendgrid_client: Optional[SendGridAPIClient] = None
        
        if SENDGRID_AVAILABLE and self.sendgrid_key:
            try:
                self.sendgrid_client = SendGridAPIClient(self.sendgrid_key)
                logger.info("SendGrid client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize SendGrid: {e}")

    def _mock_response(self, channel: str, provider: str) -> Dict:
        """Generate a mock response for testing."""
        return {
            "status": "sent",
            "provider": f"{provider} (Mock)",
            "message_id": f"{channel}_{random.randint(10000, 99999)}",
            "timestamp": datetime.now().isoformat(),
            "mock": True
        }

    async def send_email(self, to_email: str, subject: str, body: str, html_content: Optional[str] = None) -> Dict:
        """
        Send an email via SendGrid.
        Falls back to mock if SendGrid is not configured.
        """
        if self.sendgrid_client:
            try:
                message = Mail(
                    from_email=self.sendgrid_from,
                    to_emails=to_email,
                    subject=subject,
                    plain_text_content=body,
                    html_content=html_content or body
                )
                response = self.sendgrid_client.send(message)
                logger.info(f"Email sent to {to_email}, status: {response.status_code}")
                return {
                    "status": "sent" if response.status_code == 202 else "failed",
                    "provider": "SendGrid",
                    "message_id": response.headers.get("X-Message-Id", "unknown"),
                    "status_code": response.status_code,
                    "timestamp": datetime.now().isoformat(),
                    "mock": False
                }
            except Exception as e:
                logger.error(f"SendGrid error: {e}")
                return {"status": "failed", "error": str(e), "provider": "SendGrid"}
        
        # Mock mode
        logger.info(f"[Mock] Email sent to {to_email}: {subject}")
        return self._mock_response("email", "SendGrid")

    async def send_sms(self, phone_number: str, message: str) -> Dict:
        """
        Send an SMS via Twilio.
        Falls back to mock if Twilio is not configured.
        """
        if self.twilio_client and self.twilio_phone:
            try:
                msg = self.twilio_client.messages.create(
                    body=message,
                    from_=self.twilio_phone,
                    to=phone_number
                )
                logger.info(f"SMS sent to {phone_number}, SID: {msg.sid}")
                return {
                    "status": msg.status,
                    "provider": "Twilio",
                    "message_id": msg.sid,
                    "timestamp": datetime.now().isoformat(),
                    "mock": False
                }
            except Exception as e:
                logger.error(f"Twilio SMS error: {e}")
                return {"status": "failed", "error": str(e), "provider": "Twilio"}
        
        # Mock mode
        logger.info(f"[Mock] SMS sent to {phone_number}: {message}")
        return self._mock_response("sms", "Twilio")

    async def send_whatsapp(self, phone_number: str, content: str) -> Dict:
        """
        Send a WhatsApp message via Twilio.
        Phone number must be in format: whatsapp:+1234567890
        Falls back to mock if Twilio is not configured.
        """
        if self.twilio_client and self.twilio_phone:
            try:
                # Ensure WhatsApp format
                to_number = f"whatsapp:{phone_number}" if not phone_number.startswith("whatsapp:") else phone_number
                from_number = f"whatsapp:{self.twilio_phone}" if not self.twilio_phone.startswith("whatsapp:") else self.twilio_phone
                
                msg = self.twilio_client.messages.create(
                    body=content,
                    from_=from_number,
                    to=to_number
                )
                logger.info(f"WhatsApp sent to {phone_number}, SID: {msg.sid}")
                return {
                    "status": msg.status,
                    "provider": "Twilio WhatsApp",
                    "message_id": msg.sid,
                    "timestamp": datetime.now().isoformat(),
                    "mock": False
                }
            except Exception as e:
                logger.error(f"Twilio WhatsApp error: {e}")
                return {"status": "failed", "error": str(e), "provider": "Twilio WhatsApp"}
        
        # Mock mode
        logger.info(f"[Mock] WhatsApp sent to {phone_number}: {content}")
        return self._mock_response("whatsapp", "Meta WhatsApp API")

    async def get_channel_status(self) -> Dict:
        """Returns the health/connection status of configured channels."""
        return {
            "email": {
                "status": "connected" if self.sendgrid_client else "mock",
                "provider": "SendGrid",
                "configured": bool(self.sendgrid_key)
            },
            "sms": {
                "status": "connected" if self.twilio_client else "mock",
                "provider": "Twilio",
                "configured": bool(self.twilio_sid)
            },
            "whatsapp": {
                "status": "connected" if self.twilio_client else "mock",
                "provider": "Twilio WhatsApp",
                "configured": bool(self.twilio_sid)
            }
        }


# Singleton instance
cpaas_service = CPaaSService()

