from fastapi import APIRouter
from app.api.endpoints import (
    dashboard, projects, chat, content, design, workflow, presentation, 
    campaigns, agent, communications, analytics, discovery, crm,
    auth, organizations, brands, creators, admin, marcom, jobs, profile
)

api_router = APIRouter()

# Existing routes
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(design.router, prefix="/design", tags=["design"])
api_router.include_router(workflow.router, prefix="/workflow", tags=["workflow"])
api_router.include_router(presentation.router, prefix="/presentation", tags=["presentation"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(agent.router, prefix="/agent", tags=["agent"])
api_router.include_router(communications.router, prefix="/communications", tags=["communications"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(discovery.router, prefix="/discovery", tags=["discovery"])
api_router.include_router(crm.router, prefix="/crm", tags=["crm"])

# Phase 9: Multi-tenant & Admin
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(brands.router, prefix="/brands", tags=["brands"])
api_router.include_router(creators.router, prefix="/creators", tags=["creators"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(marcom.router, prefix="/marcom", tags=["marcom"])

# Phase 23: Background Jobs
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])

# Phase 33: Profile Settings
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])


