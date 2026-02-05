"""
Database models for storing creator and influencer data from influencers.club API.
Models support multi-platform profiles with enrichment history.
Separate from creator.py which manages the brand's creator roster.
"""

from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Boolean, JSON,
    ForeignKey, Table, UniqueConstraint, Index, func
)
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional

from app.core.database import Base


# Association table for many-to-many relationship between creators and brands
influencer_brands = Table(
    'influencer_brands',
    Base.metadata,
    Column('influencer_id', Integer, ForeignKey('influencers.id'), primary_key=True),
    Column('brand_id', Integer, ForeignKey('influencer_brands_ref.id'), primary_key=True),
)


class Influencer(Base):
    """
    Influencer profile from influencers.club API.
    One influencer record can have multiple social profiles across platforms.
    This is separate from Creator model which tracks brand roster members.
    """
    __tablename__ = "influencers"
    __table_args__ = (
        UniqueConstraint('email', 'org_id', name='influencer_email_org_unique'),
        Index('ix_influencers_email', 'email'),
        Index('ix_influencers_org_id', 'org_id'),
        Index('ix_influencers_name', 'name'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey('organizations.id'), nullable=False)
    
    # Basic information
    name = Column(String(255), nullable=False)
    email = Column(String(255), index=True)
    email_type = Column(String(50))  # personal, business, role-based
    country = Column(String(100))
    state = Column(String(100))
    city = Column(String(100))
    language = Column(String(50))
    
    # Contact information
    phone_number = Column(String(20))
    website = Column(String(500))
    
    # Influencer metrics
    total_followers = Column(Integer, default=0)
    total_engagement_rate = Column(Float, default=0.0)  # percentage
    is_verified = Column(Boolean, default=False)
    has_done_brand_deals = Column(Boolean, default=False)
    has_merch = Column(Boolean, default=False)
    has_link_in_bio = Column(Boolean, default=False)
    does_live_streaming = Column(Boolean, default=False)
    promotes_affiliate_links = Column(Boolean, default=False)
    
    # Account type
    account_type = Column(String(50))  # business, creator, personal
    creator_type = Column(String(50))  # nano, micro, macro, mega
    
    # Metadata and enrichment
    influencers_club_id = Column(String(255), unique=True, index=True)  # External ID
    last_enriched_at = Column(DateTime, default=datetime.utcnow)
    enrichment_mode = Column(String(50))  # raw, full, basic, advanced
    raw_data = Column(JSON)  # Store complete API response
    
    # Relationships
    social_profiles = relationship("InfluencerSocialProfile", back_populates="influencer", cascade="all, delete-orphan")
    brands = relationship("InfluencerBrand", back_populates="influencer")
    campaigns = relationship("InfluencerCampaign", back_populates="influencer", cascade="all, delete-orphan")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Influencer {self.name} ({self.email})>"


class InfluencerSocialProfile(Base):
    """
    Social media profiles for an influencer across different platforms.
    One influencer can have multiple platform profiles.
    """
    __tablename__ = "influencer_social_profiles"
    __table_args__ = (
        UniqueConstraint('influencer_id', 'platform', 'handle', name='social_profile_unique'),
        Index('ix_social_profile_platform', 'platform'),
        Index('ix_social_profile_handle', 'handle'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    influencer_id = Column(Integer, ForeignKey('influencers.id'), nullable=False)
    
    # Platform identification
    platform = Column(String(50), nullable=False)  # instagram, tiktok, youtube, twitter, twitch, onlyfans
    handle = Column(String(255), nullable=False)
    platform_user_id = Column(String(255), unique=True)
    profile_url = Column(String(500))
    profile_picture = Column(String(500))
    
    # Followers and engagement
    follower_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    engagement_source = Column(String(100))  # Method used to calculate engagement
    
    # Content metrics
    post_count = Column(Integer, default=0)
    average_likes = Column(Integer, default=0)
    average_comments = Column(Integer, default=0)
    median_likes = Column(Integer, default=0)
    median_comments = Column(Integer, default=0)
    
    # Activity
    posting_frequency = Column(Float, default=0.0)  # posts per month
    most_recent_post_date = Column(DateTime)
    
    # Platform-specific fields
    is_business_account = Column(Boolean, default=False)
    is_private = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    has_profile_pic = Column(Boolean, default=True)
    
    # Bio information
    bio = Column(String(1000))
    bio_links = Column(JSON)  # Array of links in bio
    
    # Growth metrics
    follower_growth_percentage = Column(Float)
    follower_growth_months = Column(Integer)  # 3, 6, 9, or 12 months
    
    # Monetization
    is_monetizing = Column(Boolean, default=False)
    estimated_income_monthly = Column(Float)  # estimated earnings
    
    # Tags and categories
    category = Column(String(100))  # e.g., "Fashion", "Tech", "Gaming"
    hashtags_used = Column(JSON)  # List of primary hashtags
    topics = Column(JSON)  # Main content topics
    
    # Raw data storage
    raw_data = Column(JSON)  # Store complete platform data
    
    # Relationships
    influencer = relationship("Influencer", back_populates="social_profiles")
    posts = relationship("InfluencerPost", back_populates="social_profile", cascade="all, delete-orphan")
    
    # Timestamps
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<InfluencerSocialProfile {self.handle} on {self.platform}>"


class InfluencerPost(Base):
    """
    Social media posts from influencers with engagement metrics.
    """
    __tablename__ = "influencer_posts"
    __table_args__ = (
        UniqueConstraint('social_profile_id', 'platform_post_id', name='post_unique'),
        Index('ix_post_platform_id', 'platform_post_id'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    social_profile_id = Column(Integer, ForeignKey('influencer_social_profiles.id'), nullable=False)
    
    # Post identification
    platform_post_id = Column(String(255), nullable=False)
    post_url = Column(String(500))
    
    # Content
    caption = Column(String(5000))
    media_type = Column(String(50))  # image, video, carousel, reel, etc.
    media_url = Column(String(500))
    
    # Engagement metrics
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    saves_count = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    impressions = Column(Integer, default=0)
    
    # Post metadata
    posted_at = Column(DateTime, nullable=False)
    retrieved_at = Column(DateTime, default=datetime.utcnow)
    
    # Platform-specific
    hashtags = Column(JSON)
    mentions = Column(JSON)
    tagged_accounts = Column(JSON)
    
    # Performance
    is_ad = Column(Boolean, default=False)
    video_duration = Column(Integer)  # seconds
    
    # Relationships
    social_profile = relationship("InfluencerSocialProfile", back_populates="posts")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<InfluencerPost {self.platform_post_id}>"


class InfluencerBrand(Base):
    """
    Brands that influencers have worked with.
    """
    __tablename__ = "influencer_brands_ref"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(String(1000))
    website = Column(String(500))
    industry = Column(String(100))
    
    # Relationships
    influencers = relationship("Influencer", secondary=influencer_brands, back_populates="brands")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<InfluencerBrand {self.name}>"


class InfluencerCampaign(Base):
    """
    Track which influencers are involved in marketing campaigns.
    """
    __tablename__ = "influencer_campaigns"
    __table_args__ = (
        UniqueConstraint('influencer_id', 'campaign_id', name='influencer_campaign_unique'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    influencer_id = Column(Integer, ForeignKey('influencers.id'), nullable=False)
    campaign_id = Column(Integer, ForeignKey('campaigns.id'), nullable=False)
    
    # Status tracking
    status = Column(String(50), default="prospecting")  # prospecting, contacted, negotiating, agreed, completed
    notes = Column(String(1000))
    
    # Contact information
    contact_email = Column(String(255))
    contact_phone = Column(String(20))
    contact_date = Column(DateTime)
    
    # Terms
    estimated_reach = Column(Integer)
    estimated_engagement = Column(Integer)
    proposed_fee = Column(Float)
    promised_deliverables = Column(String(500))
    
    # Relationships
    influencer = relationship("Influencer", back_populates="campaigns")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<InfluencerCampaign influencer_id={self.influencer_id} campaign_id={self.campaign_id}>"


class InfluencerEnrichmentLog(Base):
    """
    Track API calls and enrichment history for auditing and optimization.
    """
    __tablename__ = "influencer_enrichment_logs"
    __table_args__ = (
        Index('ix_enrichment_influencer', 'influencer_id'),
        Index('ix_enrichment_date', 'created_at'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    influencer_id = Column(Integer, ForeignKey('influencers.id'), nullable=False, index=True)
    
    # Enrichment details
    enrichment_type = Column(String(50))  # handle_raw, handle_full, email_basic, email_advanced, discovery
    platform = Column(String(50))
    
    # API metrics
    credits_used = Column(Float)
    api_response_time = Column(Float)  # milliseconds
    
    # Results
    success = Column(Boolean, default=False)
    error_message = Column(String(500))
    
    # Relationships
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<InfluencerEnrichmentLog {self.enrichment_type}>"
