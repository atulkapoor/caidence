from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for legacy/invited users
    full_name = Column(String)
    
    # Profile fields
    company = Column(String, nullable=True)
    location = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    industry = Column(String, nullable=True)
    
    # Organization & Role
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # RBAC Fields
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    role = Column(String, default="viewer")  # Keeping for back-compat/quick check, sync with role_id
    
    # Profile type (agency / brand / creator) — set during onboarding
    profile_type = Column(String, nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)  # Requires super admin approval for new signups
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="members")
    team = relationship("Team", back_populates="members")
    role_model = relationship("Role", back_populates="users") # Rename to avoid conflict with 'role' string
    
    # Legacy permission (to be deprecated)
    # permissions = relationship("UserPermission", back_populates="user", cascade="all, delete-orphan")
    
    # New Granular Permissions
    custom_permissions = relationship("Permission", back_populates="user", cascade="all, delete-orphan")
    
    campaigns = relationship("Campaign", back_populates="owner")
    activities = relationship("ActivityLog", back_populates="user")
    projects = relationship("Project", back_populates="owner")

    # Social & Onboarding
    social_connections = relationship("SocialConnection", back_populates="user", cascade="all, delete-orphan")
    onboarding_progress = relationship("OnboardingProgress", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    status = Column(String, default="draft")  # draft, active, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="campaigns")

    # Expanded Fields for Real Implementation
    # Expanded Fields for Real Implementation
    budget = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    channels = Column(Text, nullable=True)
    audience_targeting = Column(Text, nullable=True)

    # Relationships
    influencers = relationship("Influencer", secondary="campaign_influencers", back_populates="campaigns")
    events = relationship("CampaignEvent", back_populates="campaign")
    comments = relationship("Comment", back_populates="campaign") 

class Influencer(Base):
    __tablename__ = "influencers"

    id = Column(Integer, primary_key=True, index=True)
    handle = Column(String, unique=True, index=True)
    platform = Column(String)  # Instagram, TikTok, YouTube
    followers = Column(Integer)
    avatar_url = Column(String, nullable=True)
    engagement_rate = Column(String, nullable=True) # Stored as string to preserve Formatting or floats
    metrics_json = Column(Text, nullable=True) # Richer data: reliability, detailed demographics
    
    campaigns = relationship("Campaign", secondary="campaign_influencers", back_populates="influencers")

class CampaignInfluencer(Base):
    __tablename__ = "campaign_influencers"

    campaign_id = Column(Integer, ForeignKey("campaigns.id"), primary_key=True)
    influencer_id = Column(Integer, ForeignKey("influencers.id"), primary_key=True)
    status = Column(String, default="selected") # selected, contacted, hired, rejected
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

class CampaignEvent(Base):
    __tablename__ = "campaign_events"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    type = Column(String, index=True) # launch, click, view, conversion
    value = Column(Integer, default=1) # For varying weights (e.g. sale value)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    campaign = relationship("Campaign", back_populates="events")


class ActivityLog(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)  # e.g., "Created Email Campaign"
    details = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="activities")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    objective = Column(Text)
    project_type = Column(String) # e.g., "Marketing Campaign", "Brand Launch"
    status = Column(String, default="active")
    strategy_json = Column(Text, nullable=True) # JSON string of AI-generated strategy
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="projects")


# --- Studio Models ---

class ContentGeneration(Base):
    __tablename__ = "content_generations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    platform = Column(String)  # Instagram, LinkedIn, etc.
    content_type = Column(String) # Post, Blog, etc.
    prompt = Column(Text)
    result = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

    # owner = relationship("User") # Add back_populate if needed

class DesignAsset(Base):
    __tablename__ = "design_assets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    style = Column(String)
    aspect_ratio = Column(String)
    prompt = Column(Text)
    image_url = Column(Text) # Base64 is large
    brand_colors = Column(String, nullable=True) # Check if this causes migration issues
    reference_image = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    status = Column(String, default="active") # active, paused, draft
    steps_json = Column(Text) # JSON string of steps/nodes
    run_count = Column(Integer, default=0)
    last_run = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

    runs = relationship("WorkflowRun", back_populates="workflow")

class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    status = Column(String) # pending, running, completed, failed
    logs = Column(Text) # JSON string of logs or simple text
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    workflow = relationship("Workflow", back_populates="runs")

class Presentation(Base):
    __tablename__ = "presentations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    source_type = Column(String) # upload, powerbi
    slides_json = Column(Text) # JSON string of slide data
    slide_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True) # To group chats
    role = Column(String) # user, ai
    content = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

# class UserPermission(Base):
#     __tablename__ = "user_permissions"
#
#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     module = Column(String)  # Key from Sidebar (e.g., 'workflow', 'crm')
#     access_level = Column(String, default="write") # "read", "write"
#     
#     user = relationship("User", back_populates="permissions")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    
    user = relationship("User")
    campaign = relationship("Campaign")


class CreatorSearch(Base):
    """Log of creator searches from Influencers Club API for analytics and caching"""
    __tablename__ = "creator_searches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    query = Column(String)
    platform = Column(String, nullable=True)
    filters = Column(Text)  # JSON string
    result_count = Column(Integer, default=0)
    credits_used = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")


class CreditAccount(Base):
    """User credit account tracking balance and usage"""
    __tablename__ = "credit_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)
    
    # Credit balances
    balance = Column(Float, default=0.0)  # Current available credits
    monthly_allotment = Column(Float, default=1000.0)  # Monthly limit
    total_spent = Column(Float, default=0.0)  # Lifetime spent
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    reset_at = Column(DateTime(timezone=True), nullable=True)  # Last monthly reset
    
    user = relationship("User", backref="credit_account")


class CreditTransaction(Base):
    """Log of credit transactions for audit trail"""
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    credit_account_id = Column(Integer, ForeignKey("credit_accounts.id"), index=True, nullable=False)
    
    # Transaction details
    transaction_type = Column(String)  # 'discovery_search', 'creator_enrich', 'monthly_reset', 'manual_purchase'
    amount = Column(Float, nullable=False)  # Credits spent (negative) or added (positive)
    balance_before = Column(Float)
    balance_after = Column(Float)
    
    # Metadata
    description = Column(Text, nullable=True)
    api_call_id = Column(String, nullable=True)  # Correlate with API logs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
    credit_account = relationship("CreditAccount")

