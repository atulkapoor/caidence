import random
from typing import List, Dict, Optional
from datetime import datetime

class CPaaSService:
    """
    Mock service for Communications Platform as a Service (CPaaS).
    Simulates integration with providers like Twilio, SendGrid, Meta (WhatsApp).
    """

    async def send_email(self, to_email: str, subject: str, body: str) -> Dict:
        """Simulates sending an email."""
        print(f"[CPaaS] Sending Email to {to_email}: {subject}")
        # Simulate network delay and success
        return {
            "status": "sent",
            "provider": "SendGrid (Mock)",
            "message_id": f"email_{random.randint(10000, 99999)}",
            "timestamp": datetime.now().isoformat()
        }

    async def send_sms(self, phone_number: str, message: str) -> Dict:
        """Simulates sending an SMS."""
        print(f"[CPaaS] Sending SMS to {phone_number}: {message}")
        return {
            "status": "sent",
            "provider": "Twilio (Mock)",
            "message_id": f"sms_{random.randint(10000, 99999)}",
            "timestamp": datetime.now().isoformat()
        }

    async def send_whatsapp(self, phone_number: str, content: str) -> Dict:
        """Simulates sending a WhatsApp message."""
        print(f"[CPaaS] Sending WhatsApp to {phone_number}: {content}")
        return {
            "status": "sent",
            "provider": "Meta WhatsApp API (Mock)",
            "message_id": f"wa_{random.randint(10000, 99999)}",
            "timestamp": datetime.now().isoformat()
        }

    async def get_channel_status(self) -> Dict:
        """Returns the health/connection status of configured channels."""
        return {
            "email": {"status": "connected", "provider": "SendGrid", "quota": "98%"},
            "sms": {"status": "connected", "provider": "Twilio", "balace": "$14.50"},
            "whatsapp": {"status": "connected", "provider": "Meta Business", "quality_rating": "High"}
        }

cpaas_service = CPaaSService()
