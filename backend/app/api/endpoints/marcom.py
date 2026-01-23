from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict
from app.services.ai_service import AIService
from app.api import deps
from sqlalchemy.orm import Session

router = APIRouter()

class MarcomRequest(BaseModel):
    tool_id: str
    inputs: Dict[str, str]

class MarcomResponse(BaseModel):
    content: str
    tool_id: str

@router.post("/generate", response_model=MarcomResponse)
async def generate_marcom(
    request: MarcomRequest,
    current_user = Depends(deps.get_current_active_user)
):
    """
    Generates content for a specific Marcom tool.
    Authorized users only.
    """
    try:
        content = await AIService.generate_marcom_content(request.tool_id, request.inputs)
        return MarcomResponse(
            content=content,
            tool_id=request.tool_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
