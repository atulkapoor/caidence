from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from app.core.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.get("/stats", response_model=schemas.DashboardData)
async def get_dashboard_stats(time_range: str = Query("6m", alias="range"), db: AsyncSession = Depends(get_db)):
    # 1. Stats (Global or filtered? Usually global stats, but performance chart is specific. 
    # The requirement is "Performance Overview should have tabs". 
    # So I should probably ONLY filter the 'performance' part of the response, OR typical dashboards filter everything. 
    # Given the UI structure, "Performance Overview" is a separate card. 
    # However, the user asked for tabs *on that card*. 
    # If I filter the whole endpoint, the top stats might jump around which might be confusing. 
    # But usually "Dashboard Filters" apply to everything. 
    # "Performance Overview should have tabs..." suggests strictly that component.
    # Refactoring to a separate endpoint strictly for performance would be cleaner as per plan, 
    # BUT I am editing `get_dashboard_stats`.
    # I will stick to filtering ONLY the performance list in this response for now, 
    # to avoid breaking the top stats if they are meant to be "Total".
    # Actually, the user might expect the whole dashboard to filter, but the request was specific to Performance Overview.
    # I will filter the *performance metrics* based on range. The top cards (Active Campaigns etc) usually show "Current Active", not "Active in last 7 days".
    # Activity log is "recent", so that stays.
    
    # 1. Stats (Current state, not time-series)
    active_campaigns_query = select(func.count(models.Campaign.id)).where(models.Campaign.status == "active")
    active_campaigns = await db.execute(active_campaigns_query)
    active_count = active_campaigns.scalar() or 0
    
    workflows_query = select(func.count(models.Workflow.id))
    workflows = await db.execute(workflows_query)
    
    content_query = select(func.count(models.ContentGeneration.id))
    content = await db.execute(content_query)
    
    conversations_query = select(func.count(models.ChatMessage.id))
    conversations = await db.execute(conversations_query)

    stats = {
        "active_campaigns": active_count,
        "active_campaigns_growth": 2.5 if active_count > 0 else 0,
        "ai_workflows": workflows.scalar() or 0,
        "content_generated": content.scalar() or 0,
        "ai_conversations": conversations.scalar() or 0,
    }

    # 2. Activities
    activities_result = await db.execute(select(models.ActivityLog).limit(5).order_by(models.ActivityLog.timestamp.desc()))
    activities = activities_result.scalars().all()

    # 3. Performance (Dynamic Aggregation)
    import datetime
    from collections import defaultdict
    
    today = datetime.date.today()
    performance_map = defaultdict(lambda: {"campaigns": 0, "engagement": 0})
    labels = []
    
    # Determine bucket size and range
    if time_range == "7d":
        days_back = 7
        date_format = "%a" # Mon, Tue
        # Generate last 7 days keys
        for i in range(days_back - 1, -1, -1):
             d = today - datetime.timedelta(days=i)
             labels.append(d.strftime(date_format))
    elif time_range == "30d":
        days_back = 30
        date_format = "%d %b" # 12 Jan
        # Maybe show every 5th day? Or all days? Bar chart for 30 bars is fine.
        for i in range(days_back - 1, -1, -1):
             d = today - datetime.timedelta(days=i)
             labels.append(d.strftime(date_format))
    else: # 6m default
        days_back = 180
        date_format = "%b" # Jan
        # Generate last 6 months keys
        for i in range(5, -1, -1):
            d = today - datetime.timedelta(days=i*30) 
            l = d.strftime(date_format)
            if l not in labels: labels.append(l)

    # Initialize map
    for l in labels:
        performance_map[l]

    # Fetch relevant campaigns
    # Optimization: Filter DB query by date range to avoid fetching everything
    start_date = today - datetime.timedelta(days=days_back)
    campaigns_query = select(models.Campaign).where(models.Campaign.created_at >= start_date)
    campaigns_result = await db.execute(campaigns_query)
    filtered_campaigns = campaigns_result.scalars().all()
    
    for camp in filtered_campaigns:
        if camp.created_at:
            # Match format
            key = camp.created_at.strftime(date_format)
            if key in performance_map:
               performance_map[key]["campaigns"] += 1
    
    # Construct list (sorted by labels order)
    performance = []
    for key in labels:
        performance.append({
            "name": key,
            "campaigns": performance_map[key]["campaigns"],
            "engagement": performance_map[key]["engagement"]
        })

    # 4. Featured Campaign (Real Active Only)
    featured = None
    if active_count > 0:
        # Fetch the most recently updated active campaign
        feat_query = await db.execute(select(models.Campaign).where(models.Campaign.status == "active").order_by(models.Campaign.updated_at.desc()).limit(1))
        feat_campaign = feat_query.scalar_one_or_none()
        if feat_campaign:
            featured = {
                "title": feat_campaign.title,
                "status": "active",
                "description": "Active campaign managed by C(AI)DENCE.", # Dynamic description if available?
                "progress": 0, # Calculate real progress if possible, else 0
                "budget": "Not set",
                "channels": 0 
            }

    return {
        "stats": stats,
        "activities": activities,
        "performance": performance,
        "featuredCampaign": featured
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
