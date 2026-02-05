from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.cpaas_service import cpaas_service
from app.api.deps import (
    get_current_active_user, require_marcom_read, require_marcom_write
)
from app.models.models import User

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
async def get_connection_status(
    current_user: User = Depends(require_marcom_read)
):
    """Get the status of all communication channels."""
    return await cpaas_service.get_channel_status()

@router.post("/send/email")
async def send_email(
    request: EmailRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_marcom_write)
):
    """Trigger an email send."""
    try:
        result = await cpaas_service.send_email(
            request.to_email, request.subject, request.body
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send/sms")
async def send_sms(
    request: SMSRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_marcom_write)
):
    """Trigger an SMS send."""
    try:
        result = await cpaas_service.send_sms(
            request.phone_number, request.message
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send/whatsapp")
async def send_whatsapp(
    request: WhatsAppRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_marcom_write)
):
    """Trigger a WhatsApp message."""
    try:
        result = await cpaas_service.send_whatsapp(
            request.phone_number, request.content
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

