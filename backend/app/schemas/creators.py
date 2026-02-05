"""
Pydantic schemas for creator discovery and enrichment API endpoints.
"""

from pydantic import BaseModel, Field, EmailStr, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class PlatformEnum(str, Enum):
    """Supported social media platforms."""
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    TWITTER = "twitter"
    TWITCH = "twitch"
    ONLYFANS = "onlyfans"


class EnrichmentModeEnum(str, Enum):
    """Enrichment detail levels."""
    RAW = "raw"
    FULL = "full"
    BASIC = "basic"
    ADVANCED = "advanced"


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class CreatorDiscoveryFilters(BaseModel):
    """Filters for creator discovery search."""
    
    # Common filters
    ai_keywords: Optional[str] = Field(None, description="Natural language AI search")
    location: Optional[List[str]] = Field(None, description="Country or city")
    type: Optional[str] = Field(None, description="creator or business")
    gender: Optional[str] = Field(None, description="male, female, or any")
    profile_language: Optional[List[str]] = Field(None, description="ISO 639-1 language codes")
    
    # Engagement and followers
    number_of_followers: Optional[Dict[str, int]] = Field(
        None, 
        description="min/max follower range"
    )
    engagement_percent: Optional[Dict[str, float]] = Field(
        None,
        description="min/max engagement rate range"
    )
    
    # Activity filters
    posting_frequency: Optional[int] = Field(None, description="Posts per month")
    is_verified: Optional[bool] = None
    exclude_private_profile: Optional[bool] = None
    
    # Monetization and partnerships
    has_done_brand_deals: Optional[bool] = None
    has_link_in_bio: Optional[bool] = None
    has_merch: Optional[bool] = None
    does_live_streaming: Optional[bool] = None
    promotes_affiliate_links: Optional[bool] = None
    
    # Content filters
    keywords_in_bio: Optional[List[str]] = None
    exclude_keywords_in_bio: Optional[List[str]] = None
    hashtags: Optional[List[str]] = None
    not_hashtags: Optional[List[str]] = None
    
    # Platform-specific features
    creator_has: Optional[Dict[str, bool]] = Field(
        None,
        description="Links to specific platforms/services"
    )
    brands: Optional[List[str]] = None
    similar_to: Optional[List[str]] = Field(None, description="Similar to Example creator handles")
    
    class Config:
        json_schema_extra = {
            "example": {
                "ai_keywords": "fitness influencers",
                "location": ["United States"],
                "number_of_followers": {"min": 10000, "max": 500000},
                "engagement_percent": {"min": 2.0},
                "posting_frequency": 4
            }
        }


class CreatorDiscoveryRequest(BaseModel):
    """Request to discover creators with filters."""
    
    platform: PlatformEnum = Field(..., description="Social media platform")
    filters: CreatorDiscoveryFilters = Field(..., description="Search and filter criteria")
    limit: int = Field(20, ge=1, le=50, description="Number of results (max 50)")
    offset: int = Field(0, ge=0, description="Pagination offset")
    
    class Config:
        json_schema_extra = {
            "example": {
                "platform": "instagram",
                "filters": {
                    "ai_keywords": "fashion and lifestyle",
                    "number_of_followers": {"min": 50000},
                    "engagement_percent": {"min": 1.5},
                    "location": ["United States"]
                },
                "limit": 20,
                "offset": 0
            }
        }


class CreatorEnrichmentRequest(BaseModel):
    """Request to enrich a creator profile."""
    
    handle: str = Field(..., description="Creator handle/username")
    platform: PlatformEnum = Field(..., description="Social platform")
    enrichment_mode: EnrichmentModeEnum = Field(
        EnrichmentModeEnum.FULL,
        description="Detail level: raw (0.03 credits) or full (1 credit)"
    )
    email_required: str = Field(
        "preferred",
        description="Email requirement: 'preferred' or 'must_have'"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "handle": "cristiano",
                "platform": "instagram",
                "enrichment_mode": "full",
                "email_required": "preferred"
            }
        }


class CreatorSearchRequest(BaseModel):
    """Convenience request for keyword-based creator search."""
    
    platform: PlatformEnum
    keyword: str = Field(..., description="AI search keyword (e.g., 'fitness experts')")
    follower_min: int = Field(1000, ge=0)
    follower_max: Optional[int] = Field(None, ge=0)
    limit: int = Field(20, ge=1, le=50)
    
    class Config:
        json_schema_extra = {
            "example": {
                "platform": "tiktok",
                "keyword": "AI and technology creators",
                "follower_min": 5000,
                "follower_max": 100000,
                "limit": 20
            }
        }


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class SocialProfileResponse(BaseModel):
    """Creator's social media profile information."""
    
    platform: str
    handle: str
    profile_url: Optional[str]
    profile_picture: Optional[str]
    
    follower_count: int
    following_count: int
    engagement_rate: float
    post_count: int
    
    is_verified: bool
    is_business_account: bool
    is_private: bool
    
    bio: Optional[str]
    posting_frequency: Optional[float]
    most_recent_post_date: Optional[datetime]
    
    class Config:
        from_attributes = True


class CreatorDetailResponse(BaseModel):
    """Detailed creator profile response."""
    
    id: int
    name: str
    email: Optional[str]
    country: Optional[str]
    city: Optional[str]
    
    # Aggregate metrics across all platforms
    total_followers: int
    total_engagement_rate: float
    is_verified: bool
    
    # Partnerships and monetization
    has_done_brand_deals: bool
    has_merch: bool
    has_link_in_bio: bool
    does_live_streaming: bool
    promotes_affiliate_links: bool
    
    account_type: Optional[str]
    creator_type: Optional[str]
    
    # Social profiles
    social_profiles: List[SocialProfileResponse] = []
    
    # Metadata
    last_enriched_at: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CreatorListResponse(BaseModel):
    """List of creators with basic information."""
    
    id: int
    name: str
    email: Optional[str]
    total_followers: int
    total_engagement_rate: float
    account_type: Optional[str]
    primary_platform: Optional[str]
    is_verified: bool
    
    class Config:
        from_attributes = True


class DiscoverySearchResponse(BaseModel):
    """Response from creator discovery search."""
    
    total_results: int
    limit: int
    offset: int
    results: List[CreatorDetailResponse]
    has_more: bool = False
    credits_used: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_results": 1250,
                "limit": 20,
                "offset": 0,
                "has_more": True,
                "credits_used": 0.2,
                "results": []
            }
        }


class EnrichmentResponse(BaseModel):
    """Response from creator enrichment."""
    
    creator: CreatorDetailResponse
    credits_used: float
    enrichment_mode: str
    enriched_at: datetime
    
    class Config:
        from_attributes = True


class CreatorStatsResponse(BaseModel):
    """Aggregate statistics about discovered/enriched creators."""
    
    total_creators: int
    average_followers: float
    average_engagement_rate: float
    verified_count: int
    has_brand_deals_count: int
    has_merch_count: int
    by_platform: Dict[str, int]
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_creators": 1250,
                "average_followers": 125000,
                "average_engagement_rate": 3.2,
                "verified_count": 450,
                "has_brand_deals_count": 680,
                "has_merch_count": 320,
                "by_platform": {
                    "instagram": 450,
                    "tiktok": 520,
                    "youtube": 280
                }
            }
        }


class CreditsResponse(BaseModel):
    """API credit balance information."""
    
    available_credits: float
    used_credits: float
    total_credits: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "available_credits": 995.5,
                "used_credits": 4.5,
                "total_credits": 1000.0
            }
        }


class ErrorResponse(BaseModel):
    """Error response format."""
    
    status_code: int
    message: str
    details: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "status_code": 400,
                "message": "Invalid request parameters",
                "details": "number_of_followers.min must be >= 0"
            }
        }
