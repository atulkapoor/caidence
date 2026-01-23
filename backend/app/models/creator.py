from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Creator(Base):
    """
    Influencer/Talent in a Brand's roster.
    Can also be a self-registered user awaiting approval.
    """
    __tablename__ = "creators"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)  # Null if pending approval
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Link to user account if creator logs in
    
    # Profile Info
    handle = Column(String, nullable=False, index=True)
    platform = Column(String, nullable=False)  # Instagram, TikTok, YouTube, etc.
    name = Column(String, nullable=True)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    profile_image_url = Column(String, nullable=True)
    
    # Classification
    category = Column(String, nullable=True)  # Fashion, Tech, Fitness, etc.
    tier = Column(String, nullable=True)  # Nano, Micro, Macro, Mega
    tags = Column(JSON, nullable=True)  # ["fashion", "lifestyle", "beauty"]
    
    # Metrics
    follower_count = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    avg_views = Column(Integer, default=0)
    
    # Status
    status = Column(String, default="pending")  # pending, active, vetted, past, blacklisted
    is_approved = Column(Boolean, default=False)  # Super admin approval
    
    # Affiliate
    affiliate_code = Column(String, unique=True, nullable=True)
    commission_rate = Column(Float, default=0.10)  # 10% default
    total_earnings = Column(Float, default=0.0)
    
    # Contract
    contract_status = Column(String, nullable=True)  # none, pending, signed
    contract_url = Column(String, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    brand = relationship("Brand", back_populates="creators")
