from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- Campaign Schemas ---
class CampaignBase(BaseModel):
    title: str
    status: str = "draft"
    budget: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    channels: Optional[str] = None
    audience_targeting: Optional[str] = None

class CampaignCreate(CampaignBase):
    pass

class Campaign(CampaignBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    owner_id: int

    owner_id: int

    class Config:
        from_attributes = True

# --- Influencer & Campaign Extensions ---
class InfluencerBase(BaseModel):
    handle: str
    platform: str
    followers: int
    avatar_url: Optional[str] = None
    engagement_rate: Optional[str] = None
    metrics_json: Optional[str] = None

class InfluencerCreate(InfluencerBase):
    pass

class Influencer(InfluencerBase):
    id: int
    
    class Config:
        from_attributes = True

class CampaignEventBase(BaseModel):
    type: str
    value: int = 1
    metadata_json: Optional[str] = None

class CampaignEvent(CampaignEventBase):
    id: int
    created_at: datetime
    campaign_id: int
    
    class Config:
        from_attributes = True

class CampaignFullResponse(Campaign):
    influencers: List[Influencer] = []
    events: List[CampaignEvent] = []

# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    objective: str
    project_type: str
    strategy_json: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    status: str
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True

# --- Activity Schemas ---
class ActivityLogBase(BaseModel):
    action: str
    details: str

class ActivityLogCreate(ActivityLogBase):
    pass

class ActivityLog(ActivityLogBase):
    id: int
    timestamp: datetime
    user_id: int

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    industry: Optional[str] = None
    role: str
    organization_id: Optional[int] = None
    is_active: bool
    
    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    industry: Optional[str] = None

# --- Dashboard Stats Schema ---
class DashboardStats(BaseModel):
    active_campaigns: int
    active_campaigns_growth: float
    ai_workflows: int
    content_generated: int
    ai_conversations: int

class PerformanceMetric(BaseModel):
    name: str
    campaigns: int
    engagement: int

class CampaignSummary(BaseModel):
    title: str
    status: str
    description: str
    progress: int
    budget: str
    channels: int

class DashboardData(BaseModel):
    stats: DashboardStats
    activities: List['ActivityLog']
    performance: List[PerformanceMetric]
    featuredCampaign: Optional[CampaignSummary] = None

# --- Content Studio Schemas ---
class ContentGenerationBase(BaseModel):
    title: str
    platform: str
    content_type: str
    prompt: str

class ContentGenerationCreate(ContentGenerationBase):
    id: Optional[int] = None
    title: str
    platform: str
    content_type: str
    prompt: str
    result: Optional[str] = None
    # pass

class ContentGeneration(ContentGenerationBase):
    id: int
    result: Optional[str] = None
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True

# --- Design Studio Schemas ---
class DesignAssetBase(BaseModel):
    title: str
    style: str
    aspect_ratio: str
    prompt: str
    brand_colors: Optional[str] = None
    reference_image: Optional[str] = None

class DesignAssetCreate(DesignAssetBase):
    id: Optional[int] = None
    title: str
    style: str
    aspect_ratio: str
    prompt: str
    image_url: Optional[str] = None
    brand_colors: Optional[str] = None
    reference_image: Optional[str] = None

class DesignAsset(DesignAssetBase):
    id: int
    image_url: Optional[str] = None
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True

# --- Workflow Studio Schemas ---
class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    steps_json: str # JSON string

class WorkflowCreate(WorkflowBase):
    pass

class Workflow(WorkflowBase):
    id: int
    status: str
    run_count: int
    last_run: Optional[datetime] = None
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True

class WorkflowRun(BaseModel):
    id: int
    workflow_id: int
    status: str
    logs: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Presentation Studio Schemas ---
class PresentationBase(BaseModel):
    title: str
    source_type: str # 'upload' or 'powerbi'

class PresentationCreate(PresentationBase):
    pass

class Presentation(PresentationBase):
    id: int
    slides_json: Optional[str] = None
    slide_count: int
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True

# --- Discovery Schemas ---
class DiscoveryFilter(BaseModel):
    category: Optional[str] = None
    min_reach: Optional[int] = 0
    min_engagement: Optional[float] = 0.0
    location: Optional[str] = None

class DiscoveryRequest(BaseModel):
    query: str
    filters: Optional[DiscoveryFilter] = None

class InfluencerProfile(BaseModel):
    handle: str
    platform: str
    avatar_color: str
    followers: int
    engagement_rate: float
    content_style_match: List[str] # e.g. "High Energy", "Minimalist"
    voice_analysis: List[str] # e.g. "Authoritative", "Relatable"
    image_recognition_tags: List[str] # e.g. "Outdoors", "Tech"
    audience_demographics: str
    match_score: int # 0-100
