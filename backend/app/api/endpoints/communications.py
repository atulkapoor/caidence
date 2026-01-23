from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.cpaas_service import cpaas_service

router = APIRouter()

class EmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str

class SMSRequest(BaseModel):
    phone_number: str
    message: str

class WhatsAppRequest(BaseModel):
    phone_number: str
    content: str

@router.get("/status")
async def get_connection_status():
    """Get the status of all communication channels."""
    return await cpaas_service.get_channel_status()

@router.post("/send/email")
async def send_email(request: EmailRequest):
    """Trigger an email send."""
    return await cpaas_service.send_email(request.to_email, request.subject, request.body)

@router.post("/send/sms")
async def send_sms(request: SMSRequest):
    """Trigger an SMS send."""
    return await cpaas_service.send_sms(request.phone_number, request.message)

@router.post("/send/whatsapp")
async def send_whatsapp(request: WhatsAppRequest):
    """Trigger a WhatsApp message."""
    return await cpaas_service.send_whatsapp(request.phone_number, request.content)
