from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import ChatMessage, User
from app.services.ai_service import AIService
from pydantic import BaseModel
import uuid

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: str = None  # Optional, generates new if None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class MessageSchema(BaseModel):
    role: str
    content: str
    timestamp: str

@router.get("/history/{session_id}")
async def get_chat_history(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp))
    messages = result.scalars().all()
    return [{"role": m.role, "content": m.content, "timestamp": str(m.timestamp)} for m in messages]

@router.get("/sessions")
async def get_sessions(db: AsyncSession = Depends(get_db)):
    # Get unique session IDs for default user (id=1)
    result = await db.execute(select(ChatMessage.session_id).where(ChatMessage.user_id == 1).distinct())
    sessions = result.scalars().all()
    return sessions

@router.post("/message", response_model=ChatResponse)
async def chat_message(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    user_id = 1 # Default demo user
    session_id = request.session_id or str(uuid.uuid4())

    # 1. Fetch User Profile for context
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    
    # Build personalized context from user profile
    profile_context = ""
    if user:
        if user.industry:
            profile_context += f" The user works in the {user.industry} industry."
        if user.company:
            profile_context += f" They work at {user.company}."
        if user.full_name:
            profile_context += f" Address them as {user.full_name.split()[0]}."

    # 2. Save User Message
    user_msg = ChatMessage(session_id=session_id, role="user", content=request.message, user_id=user_id)
    db.add(user_msg)
    await db.commit()

    # 3. Build Context for AI
    # Fetch recent history (limit to last 10 messages to save context window)
    history = await get_chat_history(session_id, db)
    
    # Build system prompt with user profile context
    system_prompt = f"You are C(AI)DENCE, an expert AI Marketing Assistant. Be professional, concise, and helpful.{profile_context} Tailor your advice to their industry when relevant."
    
    # Format for Ollama
    ollama_messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        ollama_messages.append({"role": msg["role"], "content": msg["content"]})
    
    # 4. Call AI Service
    ai_text = await AIService.chat_completion(ollama_messages)

    # 4. Save AI Response
    ai_msg = ChatMessage(session_id=session_id, role="assistant", content=ai_text, user_id=user_id)
    db.add(ai_msg)
    await db.commit()

    return {
        "response": ai_text,
        "session_id": session_id
    }
