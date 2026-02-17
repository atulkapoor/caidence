from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class SocialConnection(Base):
    __tablename__ = "social_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    platform = Column(String, nullable=False, index=True)  # instagram, youtube, facebook, linkedin, whatsapp, snapchat

    # Platform identity
    platform_user_id = Column(String, nullable=True)
    platform_username = Column(String, nullable=True)
    platform_display_name = Column(String, nullable=True)

    # OAuth tokens
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    scopes = Column(Text, nullable=True)  # Space-separated scope string

    # Metadata
    is_active = Column(Boolean, default=True)
    follower_count = Column(Integer, nullable=True)
    profile_picture_url = Column(String, nullable=True)
    raw_profile_json = Column(Text, nullable=True)  # Full API response stored as JSON string

    connected_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="social_connections")


class OnboardingProgress(Base):
    __tablename__ = "onboarding_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)

    # Profile type selection (set at step 0)
    profile_type = Column(String, nullable=True)  # "agency" | "brand" | "creator"

    # Progress tracking
    current_step = Column(Integer, default=0)
    completed_steps = Column(Text, default="[]")  # JSON array of completed step indices
    is_complete = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Per-step form data stored as JSON
    step_data = Column(Text, default="{}")  # JSON: {"step_0": {...}, "step_1": {...}}

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="onboarding_progress", uselist=False)
