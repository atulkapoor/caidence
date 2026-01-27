from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
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
    role = Column(String, default="viewer")  # super_admin, agency_admin, agency_member, brand_admin, brand_member, creator, viewer
    
    # Status
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)  # Requires super admin approval for new signups
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="members")
    campaigns = relationship("Campaign", back_populates="owner")
    activities = relationship("ActivityLog", back_populates="user")
    projects = relationship("Project", back_populates="owner")
    permissions = relationship("UserPermission", back_populates="user", cascade="all, delete-orphan")

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
    budget = Column(Text, nullable=True)  # JSON or simple string (e.g. {"total": 5000, "allocation": {...}})
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    channels = Column(Text, nullable=True)  # JSON array of strings
    audience_targeting = Column(Text, nullable=True)  # JSON object describing audience

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
    image_url = Column(String) # For now, store mocked or S3 URL
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

class UserPermission(Base):
    __tablename__ = "user_permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    module = Column(String)  # Key from Sidebar (e.g., 'workflow', 'crm')
    access_level = Column(String, default="write") # "read", "write"
    
    user = relationship("User", back_populates="permissions")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    
    user = relationship("User")
    campaign = relationship("Campaign")

