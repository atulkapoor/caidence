from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from app.core.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.get("/stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Query real counts from the database
    active_campaigns_query = select(func.count(models.Campaign.id)).where(models.Campaign.status == "active")
    active_campaigns = await db.execute(active_campaigns_query)
    
    # Calculate mock growth based on active campaigns (simple logic for now)
    active_count = active_campaigns.scalar() or 0
    growth = 2.5 if active_count > 0 else 0

    workflows_query = select(func.count(models.Workflow.id))
    workflows = await db.execute(workflows_query)

    content_query = select(func.count(models.ContentGeneration.id))
    content = await db.execute(content_query)

    conversations_query = select(func.count(models.ChatMessage.id)) # Or distinct sessions if preferred
    conversations = await db.execute(conversations_query)

    return {
        "active_campaigns": active_count,
        "active_campaigns_growth": growth,
        "ai_workflows": workflows.scalar() or 0,
        "content_generated": content.scalar() or 0,
        "ai_conversations": conversations.scalar() or 0,
    }

@router.get("/activities", response_model=List[schemas.ActivityLog])
async def get_recent_activities(skip: int = 0, limit: int = 5, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.ActivityLog).offset(skip).limit(limit).order_by(models.ActivityLog.timestamp.desc()))
    activities = result.scalars().all()
    return activities

@router.get("/campaigns", response_model=List[schemas.Campaign])
async def get_campaigns(skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Campaign).offset(skip).limit(limit))
    campaigns = result.scalars().all()
    return campaigns
