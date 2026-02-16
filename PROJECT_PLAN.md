# C(AI)DENCE - Comprehensive Project Plan

> AI Marketing Intelligence Suite | Full-Stack Implementation Roadmap
> Created: February 2026 | Status: Active Development

---

## Related Documents

- **[ABC_PROFILES_IMPLEMENTATION_PLAN.md](ABC_PROFILES_IMPLEMENTATION_PLAN.md)** - Detailed implementation plan for Agency (A), Brand (B), Creator (C) profiles with 87 tasks, 417 hours estimated, social OAuth, onboarding wizards
- **[CAIDENCE_ABC_Profiles_Implementation_Plan.xlsx](CAIDENCE_ABC_Profiles_Implementation_Plan.xlsx)** - XLSX spreadsheet with 10 sheets: Executive Summary, Phase A-E task lists, Profile Fields Reference, Social Platforms Matrix, Onboarding Steps, Dependencies & Risks
- **[RBAC_ENGINE_IMPLEMENTATION_PLAN.md](RBAC_ENGINE_IMPLEMENTATION_PLAN.md)** - Robust RBAC engine: 20 gaps identified, 7-phase fix plan (257 hours), PermissionEngine service, audit logging, tenant isolation middleware, frontend PermissionGate/usePermission system
- **[CAIDENCE_RBAC_Engine_Plan.xlsx](CAIDENCE_RBAC_Engine_Plan.xlsx)** - XLSX with 9 sheets: Gap Analysis, Phase R1-R7 tasks, full Permission Matrix (22 resources x 8 roles)

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Architecture Overview](#3-architecture-overview)
4. [Phase 18: User Onboarding & Social Account Connection + ABC Profiles](#phase-18)
5. [Phase 19: Image Studio - Nano Banner Engine](#phase-19)
6. [Phase 20: Video & Reels Studio](#phase-20)
7. [Phase 21: Social Platform Connections](#phase-21)
8. [Phase 22: Lead Integrations Hub](#phase-22)
9. [Phase 23: Testing & Quality Assurance](#phase-23)
10. [Phase 24: Performance & Optimization](#phase-24)
11. [Phase 25: Deployment & DevOps](#phase-25)
12. [Database Schema Additions](#database-schema-additions)
13. [API Specification](#api-specification)
14. [Frontend Route Map](#frontend-route-map)
15. [Security Considerations](#security-considerations)
16. [Timeline & Milestones](#timeline-milestones)

---

## 1. Executive Summary

C(AI)DENCE is an AI-powered Marketing Intelligence Suite with a FastAPI backend and Next.js 14 frontend. The platform serves a 4-tier multi-tenant hierarchy (Platform > Agency > Brand > Creator) with 17 implementation phases already completed.

This plan covers the next evolution: **user onboarding with social account connectivity**, **image/banner generation**, **video & reels management**, **6-platform social connection activation**, and a **lead integration hub** for Facebook, Google, and LinkedIn ads.

### Key Deliverables
| # | Feature | Business Value |
|---|---------|---------------|
| 1 | Guided Onboarding + Social Connect | Reduce time-to-value from signup to first action |
| 2 | Nano Banner Engine | On-demand image/banner creation for campaigns |
| 3 | Video & Reels Studio | Short-form video content management & publishing |
| 4 | 6-Platform Social Connections | Unified social media management layer |
| 5 | Lead Integrations Hub | Centralize FB/Google/LinkedIn ad leads |

---

## 2. Current State Assessment

### Completed Modules (Phases 1-17)
| Module | Status | Key Files |
|--------|--------|-----------|
| Authentication & RBAC | Done | `auth_service.py`, `rbac.py` |
| Multi-Tenant Org Hierarchy | Done | `organization.py`, `brand.py`, `team.py` |
| Creator Discovery (Influencers Club) | Done | `influencers_club.py`, `discovery_service.py` |
| Campaign Management | Done | `campaigns.py` endpoints |
| Content Studio (AI Text) | Done | `content-studio/page.tsx` |
| Design Studio (AI Images) | Done | `design-studio/page.tsx` |
| Presentation Studio | Done | `presentation-studio/page.tsx` |
| CRM & Relationships | Done | `crm/page.tsx` |
| Analytics Dashboard | Done | `analytics/page.tsx` |
| Workflow Automation | Done | `workflow/page.tsx` |
| AI Chat & Agent | Done | `ai-chat/page.tsx`, `ai-agent/page.tsx` |
| Credit System | Done | `credit_service.py` |
| MarCom Tools | Done | `marcom/page.tsx` |
| Background Jobs | Done | `job_queue.py`, `job_tasks.py` |
| CPaaS (Email/SMS/WhatsApp) | Done | `cpaas_service.py` |
| Admin Panel | Done | `admin/page.tsx` |
| Settings & Profile | Done | `settings/page.tsx` |

### Current Database Models (30+)
- User, Organization, Team, Role, Permission, Brand
- Creator, Influencer, InfluencerSocialProfile, InfluencerPost
- Campaign, CampaignInfluencer, CampaignEvent
- ContentGeneration, DesignAsset, Presentation
- Workflow, WorkflowRun
- CreditAccount, CreditTransaction, CreatorSearch
- ChatMessage, Comment, ActivityLog, Project

### Existing Social Platform Support (Read-Only Discovery)
- Instagram, TikTok, YouTube, Twitter/X, Twitch, OnlyFans
- Via Influencers Club API (search + enrichment)
- No direct account connection / OAuth / publishing yet

### Known Gaps
- No guided onboarding flow (direct redirect to dashboard after signup)
- No OAuth social account linking
- No image banner generation (only AI art generation)
- No video/reels management
- No Facebook/LinkedIn/Snapchat connection
- No lead capture integrations (FB Ads, Google Ads, LinkedIn Ads)
- No social publishing/scheduling
- Email invitation system incomplete

---

## 3. Architecture Overview

### Current Stack
```
Frontend:  Next.js 14 (App Router) + TypeScript + Tailwind CSS
Backend:   FastAPI + SQLAlchemy 2.0 (Async) + Pydantic v2
Database:  PostgreSQL (prod) / SQLite (dev)
AI:        Ollama (local LLM) for content & image generation
Queue:     Redis + custom job system
APIs:      Influencers Club, Modash (creator discovery)
Comms:     CPaaS (Email/SMS/WhatsApp)
```

### Proposed Architecture Additions
```
OAuth2:    Facebook, Instagram, Google, LinkedIn, YouTube, Snapchat
Media:     S3/CloudFlare R2 for image/video storage
Video:     FFmpeg (server-side processing), HLS streaming
Webhooks:  Inbound webhook receiver for lead platforms
Queues:    Celery/ARQ for long-running video processing jobs
CDN:       CloudFront/CloudFlare for media delivery
```

### System Architecture Diagram (Logical)
```
                          +------------------+
                          |   Next.js 14     |
                          |   Frontend       |
                          +--------+---------+
                                   |
                          +--------+---------+
                          |   API Gateway    |
                          |   (FastAPI)      |
                          +--------+---------+
                                   |
          +----------+----+--------+--------+----------+----------+
          |          |    |        |        |          |          |
     +----v---+ +---v--+ +---v--+ +---v--+ +----v---+ +----v---+
     |  Auth  | | RBAC | |Social| |Media | | Leads  | |  AI    |
     |Service | |Engine| |Connect| |Engine| |Ingest  | |Service |
     +--------+ +------+ +------+ +------+ +--------+ +--------+
          |                  |        |        |
     +----v--+          +---v----+ +-v------+ +---v--------+
     |  DB   |          | OAuth  | |S3/R2   | | FB/Google  |
     | (PG)  |          |Providers| |Storage | | /LinkedIn  |
     +-------+          +--------+ +--------+ | Ads APIs   |
                                               +------------+
```

---

<a id="phase-18"></a>
## Phase 18: User Onboarding & Social Account Connection

### 18.1 Overview
Transform the current register > dashboard redirect into a guided, multi-step onboarding wizard that gets users to value quickly by connecting their social accounts and configuring their workspace.

### 18.2 Onboarding Flow

```
Step 1: Sign Up          Step 2: Profile Setup      Step 3: Connect Socials
+------------------+     +------------------+       +------------------+
| Email / Password |     | Company Name     |       | [Instagram]      |
| Full Name        | --> | Industry         |  -->  | [WhatsApp]       |
| -OR-             |     | Company Size     |       | [Facebook]       |
| Sign up with:    |     | Role/Title       |       | [LinkedIn]       |
|  [Google]        |     | Logo Upload      |       | [YouTube]        |
|  [Facebook]      |     | Brand Colors     |       | [Snapchat]       |
|  [LinkedIn]      |     +------------------+       | (Skip for now)   |
+------------------+                                +------------------+
         |                                                   |
         v                                                   v
Step 4: Create Brand      Step 5: Invite Team        Step 6: Dashboard
+------------------+     +------------------+       +------------------+
| Brand Name       |     | Email Invite     |       | Welcome Tour     |
| Brand URL        |     | Role Assignment  |       | Quick Actions    |
| Target Audience  | --> | Bulk Import CSV  |  -->  | Sample Data      |
| Brand Category   |     | Share Link       |       | Getting Started  |
| Social Handles   |     | (Skip for now)   |       | Checklist        |
+------------------+     +------------------+       +------------------+
```

### 18.3 Social Account OAuth Integration

#### Supported Platforms & OAuth Flows

| Platform | OAuth Version | Scopes Required | Data Access |
|----------|--------------|-----------------|-------------|
| Instagram | Instagram Graph API (via Facebook) | `instagram_basic`, `instagram_manage_insights`, `instagram_content_publish` | Profile, Media, Insights, Publishing |
| WhatsApp | WhatsApp Business API (via Facebook) | `whatsapp_business_management`, `whatsapp_business_messaging` | Business Profile, Messaging, Templates |
| Facebook | Facebook Login (OAuth 2.0) | `pages_manage_posts`, `pages_read_engagement`, `leads_retrieval` | Pages, Posts, Insights, Leads |
| Google/YouTube | Google OAuth 2.0 | `youtube.readonly`, `youtube.upload`, `yt-analytics.readonly` | Channels, Videos, Analytics |
| LinkedIn | LinkedIn OAuth 2.0 | `r_liteprofile`, `r_organization_social`, `w_organization_social` | Profile, Org Pages, Share |
| Snapchat | Snapchat Marketing API | `snapchat-marketing-api` | Ads, Audiences, Insights |

#### OAuth Flow Architecture
```
User clicks "Connect Instagram"
         |
         v
Frontend redirects to: /api/v1/social/auth/instagram
         |
         v
Backend builds OAuth URL with state token + PKCE
         |
         v
User authorizes on Instagram/Facebook
         |
         v
Callback to: /api/v1/social/callback/instagram?code=xxx&state=yyy
         |
         v
Backend exchanges code for access_token + refresh_token
         |
         v
Tokens encrypted & stored in SocialConnection table
         |
         v
Frontend receives success, shows connected status
```

### 18.4 Backend Implementation

#### New Models

```python
# backend/app/models/social_connection.py

class SocialConnection(Base):
    """User's connected social media accounts"""
    __tablename__ = "social_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)

    platform = Column(String, nullable=False)  # instagram, facebook, whatsapp, linkedin, youtube, snapchat
    platform_user_id = Column(String, nullable=True)  # Platform-specific user/page ID
    platform_username = Column(String, nullable=True)
    platform_display_name = Column(String, nullable=True)
    platform_avatar_url = Column(String, nullable=True)

    # OAuth tokens (encrypted at rest)
    access_token_encrypted = Column(Text, nullable=False)
    refresh_token_encrypted = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Connection metadata
    scopes = Column(Text, nullable=True)  # JSON array of granted scopes
    account_type = Column(String, nullable=True)  # personal, business, creator
    page_id = Column(String, nullable=True)  # For Facebook Pages / Instagram Business
    page_name = Column(String, nullable=True)

    # Status
    status = Column(String, default="active")  # active, expired, revoked, error
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="social_connections")
    organization = relationship("Organization")
    brand = relationship("Brand")

    # Unique constraint: one connection per platform per user per brand
    __table_args__ = (
        UniqueConstraint('user_id', 'platform', 'brand_id', name='uq_user_platform_brand'),
    )


class OnboardingProgress(Base):
    """Track user's onboarding completion"""
    __tablename__ = "onboarding_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Step completion flags
    profile_completed = Column(Boolean, default=False)
    brand_created = Column(Boolean, default=False)
    social_connected = Column(Boolean, default=False)  # At least one
    team_invited = Column(Boolean, default=False)
    tour_completed = Column(Boolean, default=False)

    # Metadata
    current_step = Column(Integer, default=1)  # 1-6
    skipped_steps = Column(Text, nullable=True)  # JSON array
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="onboarding_progress")
```

#### New Service: SocialAuthService

```python
# backend/app/services/social_auth_service.py

class SocialAuthService:
    """Handles OAuth flows for all supported social platforms"""

    PLATFORM_CONFIGS = {
        "instagram": {
            "auth_url": "https://www.facebook.com/v19.0/dialog/oauth",
            "token_url": "https://graph.facebook.com/v19.0/oauth/access_token",
            "scopes": ["instagram_basic", "instagram_manage_insights", "instagram_content_publish", "pages_show_list"],
            "profile_url": "https://graph.instagram.com/me",
        },
        "facebook": {
            "auth_url": "https://www.facebook.com/v19.0/dialog/oauth",
            "token_url": "https://graph.facebook.com/v19.0/oauth/access_token",
            "scopes": ["pages_manage_posts", "pages_read_engagement", "leads_retrieval", "pages_show_list"],
            "profile_url": "https://graph.facebook.com/v19.0/me",
        },
        "whatsapp": {
            "auth_url": "https://www.facebook.com/v19.0/dialog/oauth",
            "token_url": "https://graph.facebook.com/v19.0/oauth/access_token",
            "scopes": ["whatsapp_business_management", "whatsapp_business_messaging"],
        },
        "linkedin": {
            "auth_url": "https://www.linkedin.com/oauth/v2/authorization",
            "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
            "scopes": ["r_liteprofile", "r_organization_social", "w_organization_social"],
            "profile_url": "https://api.linkedin.com/v2/me",
        },
        "youtube": {
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "scopes": ["https://www.googleapis.com/auth/youtube.readonly",
                       "https://www.googleapis.com/auth/youtube.upload",
                       "https://www.googleapis.com/auth/yt-analytics.readonly"],
            "profile_url": "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        },
        "snapchat": {
            "auth_url": "https://accounts.snapchat.com/accounts/oauth2/auth",
            "token_url": "https://accounts.snapchat.com/accounts/oauth2/token",
            "scopes": ["snapchat-marketing-api"],
        },
    }

    async def initiate_oauth(platform, user_id, brand_id, redirect_uri) -> str:
        """Generate OAuth authorization URL with state token"""

    async def handle_callback(platform, code, state) -> SocialConnection:
        """Exchange auth code for tokens, create/update SocialConnection"""

    async def refresh_token(connection_id) -> SocialConnection:
        """Refresh expired OAuth tokens"""

    async def disconnect(connection_id, user_id) -> bool:
        """Revoke tokens and remove connection"""

    async def get_connections(user_id, brand_id=None) -> list[SocialConnection]:
        """List all connected accounts for a user/brand"""

    async def sync_profile(connection_id) -> dict:
        """Pull latest profile data from connected platform"""
```

#### New API Endpoints

```
# Social Auth Endpoints
GET  /api/v1/social/auth/{platform}          → Redirect to OAuth provider
GET  /api/v1/social/callback/{platform}      → OAuth callback handler
GET  /api/v1/social/connections               → List connected accounts
GET  /api/v1/social/connections/{id}          → Connection details
DELETE /api/v1/social/connections/{id}        → Disconnect account
POST /api/v1/social/connections/{id}/refresh  → Force token refresh
POST /api/v1/social/connections/{id}/sync     → Sync profile data

# Onboarding Endpoints
GET  /api/v1/onboarding/progress              → Get onboarding state
PUT  /api/v1/onboarding/step/{step_number}    → Complete a step
POST /api/v1/onboarding/skip/{step_number}    → Skip a step
POST /api/v1/onboarding/complete              → Mark onboarding done
```

### 18.5 Frontend Implementation

#### New Pages & Components

```
frontend/src/app/onboarding/
  page.tsx                    → Onboarding wizard container
  components/
    OnboardingWizard.tsx      → Step controller with progress bar
    StepSignUp.tsx            → Registration with social sign-up
    StepProfile.tsx           → Company/profile setup form
    StepSocialConnect.tsx     → Social account OAuth cards
    StepCreateBrand.tsx       → Brand creation form
    StepInviteTeam.tsx        → Team invitation form
    StepWelcome.tsx           → Welcome tour + getting started checklist
    ProgressIndicator.tsx     → Visual step progress
    SocialConnectCard.tsx     → Individual platform connect button/status
```

#### Social Connect Card Component

```
+-------------------------------------------+
|  [Instagram Icon]  Instagram               |
|  Connect your Instagram Business account   |
|  to manage posts and view insights         |
|                                            |
|  Status: Not Connected                     |
|  [Connect Instagram]                       |
+-------------------------------------------+

+-------------------------------------------+
|  [Instagram Icon]  Instagram        [...]  |
|  @brandname_official                       |
|  Business Account | 45.2K followers        |
|  Last synced: 2 hours ago                  |
|                                            |
|  Status: Connected                         |
|  [Sync Now]  [Disconnect]                  |
+-------------------------------------------+
```

### 18.6 ABC Profile Types (Agency / Brand / Creator)

Phase 18 now includes the full **ABC Profile System** that differentiates the platform experience for three user types:

| Profile | Code | Target User | Onboarding Steps | Key Profile Sections |
|---------|------|-------------|-----------------|---------------------|
| **Agency** | A | Marketing agencies, consulting firms | 6 steps: Type > Company Info > Branding > Social Connect > Invite Team > Create Brand | Company info, branding kit, white-label, team management, multi-brand dashboard |
| **Brand** | B | Individual brands / companies | 5 steps: Type > Brand Identity > Target Audience > Social Connect > Guidelines | Target audience, brand voice, content pillars, competitor tracking, guidelines |
| **Creator** | C | Influencers, content creators | 5 steps: Type > Personal Info > Social Connect (min 1) > Portfolio > Rates | Portfolio, media kit, rate card, availability, earnings, audience metrics |

**New Database Tables**: `agency_profiles`, `brand_profiles`, `creator_profiles`, `social_connections`, `onboarding_progress`

**Full Details**: See [ABC_PROFILES_IMPLEMENTATION_PLAN.md](ABC_PROFILES_IMPLEMENTATION_PLAN.md) for complete schema, task breakdown (87 tasks, 417 hours), and onboarding wireframes.

### 18.7 Tasks Breakdown

| # | Task | Priority | Est. Hours |
|---|------|----------|-----------|
| 18.1 | Create `SocialConnection` + `OnboardingProgress` DB models | P0 | 3 |
| 18.2 | Create Alembic migration for new tables | P0 | 1 |
| 18.3 | Implement `SocialAuthService` with OAuth flows | P0 | 12 |
| 18.4 | Implement token encryption/decryption utilities | P0 | 3 |
| 18.5 | Create social auth API endpoints (`/api/v1/social/*`) | P0 | 6 |
| 18.6 | Create onboarding API endpoints (`/api/v1/onboarding/*`) | P0 | 4 |
| 18.7 | Build onboarding wizard frontend (6 steps) | P0 | 16 |
| 18.8 | Build SocialConnectCard component | P0 | 4 |
| 18.9 | Integrate OAuth redirect flow in frontend | P0 | 6 |
| 18.10 | Create Facebook App & configure OAuth (Dev + Prod) | P1 | 4 |
| 18.11 | Create Google/YouTube OAuth credentials | P1 | 3 |
| 18.12 | Create LinkedIn App & configure OAuth | P1 | 3 |
| 18.13 | Create Snapchat Marketing API credentials | P2 | 3 |
| 18.14 | Token refresh background job (cron) | P1 | 4 |
| 18.15 | Onboarding analytics tracking | P2 | 3 |
| 18.16 | Unit + integration tests | P1 | 8 |
| **Total** | | | **83 hours** |

### 18.7 Environment Variables Required

```env
# Facebook / Instagram / WhatsApp (shared Facebook App)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=https://app.caidence.ai/api/v1/social/callback/facebook
INSTAGRAM_REDIRECT_URI=https://app.caidence.ai/api/v1/social/callback/instagram
WHATSAPP_REDIRECT_URI=https://app.caidence.ai/api/v1/social/callback/whatsapp

# Google / YouTube
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://app.caidence.ai/api/v1/social/callback/youtube

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=https://app.caidence.ai/api/v1/social/callback/linkedin

# Snapchat
SNAPCHAT_CLIENT_ID=
SNAPCHAT_CLIENT_SECRET=
SNAPCHAT_REDIRECT_URI=https://app.caidence.ai/api/v1/social/callback/snapchat

# Token Encryption
SOCIAL_TOKEN_ENCRYPTION_KEY=  # Fernet symmetric key for encrypting OAuth tokens at rest
```

---

<a id="phase-19"></a>
## Phase 19: Image Studio - Nano Banner Engine

### 19.1 Overview
Extend the existing Design Studio with a dedicated **Nano Banner** engine for creating marketing banners, social media images, ad creatives, and promotional graphics. "Nano" refers to rapid, small-format, campaign-ready image generation.

### 19.2 Banner Types & Templates

| Banner Type | Dimensions | Use Case |
|-------------|-----------|----------|
| Instagram Post | 1080x1080 | Feed posts, carousel slides |
| Instagram Story | 1080x1920 | Stories, Reels covers |
| Facebook Post | 1200x630 | Feed posts, link previews |
| Facebook Cover | 820x312 | Page cover photos |
| LinkedIn Post | 1200x627 | Feed posts |
| LinkedIn Banner | 1584x396 | Profile/Company banners |
| YouTube Thumbnail | 1280x720 | Video thumbnails |
| Snapchat Ad | 1080x1920 | Story ads |
| Twitter/X Post | 1600x900 | Tweet images |
| Web Banner | 728x90, 300x250, 160x600 | Display ads (IAB standards) |
| Email Header | 600x200 | Email campaign headers |
| WhatsApp Status | 1080x1920 | Status images |

### 19.3 Feature Set

#### Core Features
1. **Template Library** - Pre-designed, customizable banner templates organized by category (sale, launch, event, quote, testimonial, product showcase)
2. **AI Banner Generation** - Describe the banner in natural language, AI generates it
3. **Brand Kit Integration** - Auto-apply brand colors, fonts, logos from brand profile
4. **Layer Editor** - Simple canvas editor with text, images, shapes, and overlays
5. **Batch Generation** - Generate banners for multiple platforms from a single design
6. **Smart Resize** - Automatically adapt one design to all platform dimensions
7. **Asset Library** - Reusable elements: icons, stock photos, backgrounds, overlays

#### AI-Powered Features
1. **Text-to-Banner** - "Create a summer sale banner with 30% off in blue and gold"
2. **Image-to-Banner** - Upload a product photo, AI creates a promotional banner
3. **Copy Suggestions** - AI-generated headlines, taglines, CTAs
4. **Color Harmony** - AI suggests color palettes based on brand + mood
5. **Layout Suggestions** - AI recommends optimal text/image placement

### 19.4 Backend Implementation

#### New Models

```python
# backend/app/models/banner.py

class BannerTemplate(Base):
    """Pre-designed banner templates"""
    __tablename__ = "banner_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)  # sale, launch, event, quote, product, social
    platform = Column(String)  # instagram, facebook, linkedin, youtube, multi
    dimensions = Column(String)  # "1080x1080"
    thumbnail_url = Column(Text, nullable=True)
    template_json = Column(Text)  # Canvas layer data (JSON)
    is_premium = Column(Boolean, default=False)
    tags = Column(Text, nullable=True)  # JSON array of searchable tags
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BannerProject(Base):
    """User-created banner projects"""
    __tablename__ = "banner_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    template_id = Column(Integer, ForeignKey("banner_templates.id"), nullable=True)

    title = Column(String, index=True)
    platform = Column(String)  # Target platform
    dimensions = Column(String)  # "1080x1080"
    canvas_json = Column(Text)  # Full canvas state (layers, positions, styles)
    thumbnail_url = Column(Text, nullable=True)

    # AI Generation metadata
    ai_prompt = Column(Text, nullable=True)
    ai_model_used = Column(String, nullable=True)

    # Export info
    export_format = Column(String, nullable=True)  # png, jpg, webp, svg
    export_url = Column(Text, nullable=True)  # Final exported image URL
    export_urls_json = Column(Text, nullable=True)  # Multiple sizes/formats

    status = Column(String, default="draft")  # draft, exported, published
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    brand = relationship("Brand")
    template = relationship("BannerTemplate")
```

#### New Service: BannerService

```python
# backend/app/services/banner_service.py

class BannerService:
    async def generate_from_prompt(prompt, platform, brand_id, dimensions) -> BannerProject:
        """AI-generate a banner from natural language description"""

    async def apply_template(template_id, customizations) -> BannerProject:
        """Apply a template with user customizations"""

    async def smart_resize(project_id, target_platforms) -> list[BannerProject]:
        """Resize a banner design to multiple platform dimensions"""

    async def batch_generate(prompt, platforms, brand_id) -> list[BannerProject]:
        """Generate banners for multiple platforms from one prompt"""

    async def export(project_id, format, quality) -> str:
        """Export banner to final image file, return URL"""

    async def apply_brand_kit(project_id, brand_id) -> BannerProject:
        """Auto-apply brand colors, fonts, logo to a banner"""
```

#### New API Endpoints

```
# Banner Endpoints
GET    /api/v1/banners/templates                → List templates (filter by category/platform)
GET    /api/v1/banners/templates/{id}           → Template details
POST   /api/v1/banners/generate                 → AI-generate banner from prompt
POST   /api/v1/banners/from-template            → Create from template
GET    /api/v1/banners/projects                  → List user's banner projects
GET    /api/v1/banners/projects/{id}            → Project details + canvas data
PUT    /api/v1/banners/projects/{id}            → Update canvas/metadata
DELETE /api/v1/banners/projects/{id}            → Delete project
POST   /api/v1/banners/projects/{id}/export     → Export to image
POST   /api/v1/banners/projects/{id}/resize     → Smart resize to other platforms
POST   /api/v1/banners/batch-generate           → Batch generate for multiple platforms
POST   /api/v1/banners/projects/{id}/brand-kit  → Apply brand kit
```

### 19.5 Frontend Implementation

#### New Pages

```
frontend/src/app/banner-studio/
  page.tsx                          → Main banner studio (template browser + create)
  editor/[id]/page.tsx              → Canvas editor for a specific banner project
  history/page.tsx                  → Past banner projects gallery
  history/[id]/page.tsx             → Banner project detail view
  components/
    TemplateBrowser.tsx             → Filterable template grid
    BannerCanvas.tsx                → Canvas editor (layers, text, images)
    ToolBar.tsx                     → Editor toolbar (shapes, text, upload)
    LayerPanel.tsx                  → Layer management sidebar
    PropertyPanel.tsx               → Selected element properties
    PlatformSelector.tsx            → Target platform/dimension picker
    BrandKitPanel.tsx               → Brand colors, fonts, logo selector
    ExportDialog.tsx                → Format/quality/size export options
    AIPromptPanel.tsx               → AI generation input
    BatchGenerateDialog.tsx         → Multi-platform batch generation
```

### 19.6 Tasks Breakdown

| # | Task | Priority | Est. Hours |
|---|------|----------|-----------|
| 19.1 | Create `BannerTemplate` + `BannerProject` DB models | P0 | 3 |
| 19.2 | Alembic migration for banner tables | P0 | 1 |
| 19.3 | Implement `BannerService` with AI generation | P0 | 10 |
| 19.4 | Create banner API endpoints | P0 | 6 |
| 19.5 | Build template browser page | P0 | 6 |
| 19.6 | Build canvas editor (core layer engine) | P0 | 20 |
| 19.7 | Implement text/shape/image layer tools | P0 | 12 |
| 19.8 | Build brand kit integration panel | P1 | 6 |
| 19.9 | Implement smart resize logic | P1 | 8 |
| 19.10 | Build batch generation flow | P1 | 6 |
| 19.11 | Image export pipeline (PNG/JPG/WebP) | P0 | 6 |
| 19.12 | S3/R2 media storage integration | P0 | 4 |
| 19.13 | Seed 20+ starter templates | P2 | 8 |
| 19.14 | Banner project history page | P1 | 4 |
| 19.15 | Unit + integration tests | P1 | 6 |
| **Total** | | | **106 hours** |

---

<a id="phase-20"></a>
## Phase 20: Video & Reels Studio

### 20.1 Overview
A comprehensive video and short-form reels management studio that allows users to upload, edit, manage, schedule, and publish video content across connected social platforms.

### 20.2 Feature Set

#### Video Management
1. **Video Upload** - Drag & drop upload with progress indicator, support for MP4, MOV, AVI, WebM
2. **Video Library** - Searchable, filterable grid of all uploaded videos with thumbnails
3. **Video Metadata** - Title, description, tags, category, visibility settings
4. **Thumbnail Generation** - Auto-generate thumbnails or upload custom ones
5. **Video Transcoding** - Server-side transcoding to optimal formats per platform

#### Reels/Short-Form
1. **Reels Creator** - Trim, combine clips, add text overlays, music, transitions
2. **Aspect Ratio Presets** - 9:16 (Reels/Stories/Shorts), 1:1 (Feed), 16:9 (YouTube)
3. **Text & Sticker Overlays** - Add animated text, captions, branded stickers
4. **Music Library** - Royalty-free music tracks for background audio
5. **Auto-Captions** - AI-generated subtitles/captions from speech

#### Publishing
1. **Multi-Platform Publishing** - Publish same video to Instagram, YouTube, Facebook, LinkedIn, Snapchat
2. **Schedule** - Schedule video publish for future date/time
3. **Platform-Specific Optimization** - Auto-adjust format, resolution, caption length per platform
4. **Draft Management** - Save as draft, share for review, approval workflow

#### Analytics
1. **Video Performance** - Views, engagement, shares, comments per video
2. **Cross-Platform Compare** - Same video performance across different platforms
3. **Best Time to Post** - AI-recommended optimal posting times

### 20.3 Backend Implementation

#### New Models

```python
# backend/app/models/video.py

class VideoAsset(Base):
    """Uploaded/created video files"""
    __tablename__ = "video_assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)

    # File info
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    file_url = Column(Text, nullable=False)  # S3/R2 URL
    thumbnail_url = Column(Text, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    resolution = Column(String, nullable=True)  # "1080x1920"
    format = Column(String, nullable=True)  # mp4, mov, webm
    aspect_ratio = Column(String, nullable=True)  # "9:16", "16:9", "1:1"

    # Metadata
    tags = Column(Text, nullable=True)  # JSON array
    category = Column(String, nullable=True)  # product, tutorial, testimonial, event, bts
    visibility = Column(String, default="private")  # private, team, public

    # Processing
    transcode_status = Column(String, default="pending")  # pending, processing, completed, failed
    transcode_variants_json = Column(Text, nullable=True)  # JSON: {platform: {url, format, resolution}}

    # AI Features
    auto_captions_json = Column(Text, nullable=True)  # JSON: [{start, end, text}]
    ai_description = Column(Text, nullable=True)

    status = Column(String, default="draft")  # draft, ready, published, archived
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    brand = relationship("Brand")
    publications = relationship("VideoPublication", back_populates="video")


class ReelsProject(Base):
    """Short-form video editing project"""
    __tablename__ = "reels_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)

    title = Column(String, index=True)
    aspect_ratio = Column(String, default="9:16")
    duration_seconds = Column(Float, nullable=True)

    # Editor state
    timeline_json = Column(Text)  # JSON: clips, cuts, transitions, text overlays, audio tracks
    preview_url = Column(Text, nullable=True)  # Low-res preview
    export_url = Column(Text, nullable=True)  # Final rendered video

    # Music/Audio
    music_track_id = Column(Integer, ForeignKey("music_tracks.id"), nullable=True)
    voiceover_url = Column(Text, nullable=True)

    render_status = Column(String, default="draft")  # draft, rendering, completed, failed
    status = Column(String, default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    brand = relationship("Brand")


class VideoPublication(Base):
    """Track where videos have been published"""
    __tablename__ = "video_publications"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("video_assets.id"), nullable=False)
    social_connection_id = Column(Integer, ForeignKey("social_connections.id"), nullable=False)

    platform = Column(String, nullable=False)  # instagram, youtube, facebook, linkedin, snapchat
    platform_post_id = Column(String, nullable=True)  # ID on the platform
    platform_url = Column(Text, nullable=True)  # Direct link to published video

    status = Column(String, default="scheduled")  # scheduled, publishing, published, failed
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    # Platform-specific metadata
    caption = Column(Text, nullable=True)
    hashtags = Column(Text, nullable=True)
    platform_metadata_json = Column(Text, nullable=True)  # Platform-specific fields

    # Performance (pulled from platform)
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    last_metrics_sync = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    video = relationship("VideoAsset", back_populates="publications")
    social_connection = relationship("SocialConnection")


class MusicTrack(Base):
    """Royalty-free music library"""
    __tablename__ = "music_tracks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    artist = Column(String, nullable=True)
    genre = Column(String, index=True)
    mood = Column(String, index=True)  # upbeat, calm, energetic, dramatic
    duration_seconds = Column(Float)
    file_url = Column(Text, nullable=False)
    preview_url = Column(Text, nullable=True)
    bpm = Column(Integer, nullable=True)
    license_type = Column(String, default="royalty_free")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

#### New Service: VideoService

```python
# backend/app/services/video_service.py

class VideoService:
    async def upload_video(file, user_id, brand_id, metadata) -> VideoAsset:
        """Upload video to S3/R2, create DB record, trigger transcode"""

    async def transcode_for_platforms(video_id, platforms) -> dict:
        """Transcode video to optimal format for each platform"""

    async def generate_thumbnails(video_id, count=3) -> list[str]:
        """Extract frame thumbnails from video"""

    async def generate_auto_captions(video_id) -> list[dict]:
        """AI speech-to-text captioning"""

    async def publish_to_platform(video_id, connection_id, caption, scheduled_at) -> VideoPublication:
        """Publish video to connected social platform"""

    async def schedule_publication(video_id, publications) -> list[VideoPublication]:
        """Schedule multi-platform publication"""

    async def sync_metrics(publication_id) -> VideoPublication:
        """Pull latest engagement metrics from platform"""

    async def render_reel(project_id) -> str:
        """Server-side render of reels project to final video"""
```

#### New API Endpoints

```
# Video Endpoints
POST   /api/v1/videos/upload                        → Upload video
GET    /api/v1/videos                                → List videos (filter/search)
GET    /api/v1/videos/{id}                           → Video details
PUT    /api/v1/videos/{id}                           → Update metadata
DELETE /api/v1/videos/{id}                           → Delete video
POST   /api/v1/videos/{id}/thumbnails                → Generate thumbnails
POST   /api/v1/videos/{id}/captions                  → Generate auto-captions
POST   /api/v1/videos/{id}/transcode                 → Transcode for platforms
POST   /api/v1/videos/{id}/publish                   → Publish to platform(s)
GET    /api/v1/videos/{id}/publications               → List publications & metrics
POST   /api/v1/videos/{id}/publications/{pub_id}/sync → Sync metrics

# Reels Endpoints
POST   /api/v1/reels/projects                        → Create reels project
GET    /api/v1/reels/projects                         → List reels projects
GET    /api/v1/reels/projects/{id}                   → Project details + timeline
PUT    /api/v1/reels/projects/{id}                   → Update timeline/metadata
POST   /api/v1/reels/projects/{id}/render            → Render final video
DELETE /api/v1/reels/projects/{id}                   → Delete project

# Music Library
GET    /api/v1/music                                  → Browse music tracks
GET    /api/v1/music/{id}/preview                    → Stream preview
```

### 20.4 Frontend Implementation

#### New Pages

```
frontend/src/app/video-studio/
  page.tsx                          → Video library + upload
  upload/page.tsx                   → Detailed upload form
  [id]/page.tsx                     → Video details + publish controls
  components/
    VideoUploader.tsx               → Drag & drop upload with progress
    VideoLibrary.tsx                → Grid/list view of videos
    VideoCard.tsx                   → Video thumbnail card
    VideoPlayer.tsx                 → Custom video player with controls
    PublishDialog.tsx               → Multi-platform publish modal
    ScheduleDialog.tsx              → Schedule publication date/time
    MetricsPanel.tsx                → Video performance metrics
    CaptionEditor.tsx              → Edit auto-generated captions
    ThumbnailSelector.tsx          → Choose/upload thumbnail

frontend/src/app/reels-studio/
  page.tsx                          → Reels project list + create
  editor/[id]/page.tsx             → Timeline editor
  components/
    TimelineEditor.tsx             → Video clip timeline with drag/drop
    ClipTrimmer.tsx                → Trim individual clips
    TextOverlayTool.tsx            → Add/position text overlays
    MusicBrowser.tsx               → Browse & add music tracks
    TransitionPicker.tsx           → Transition effects between clips
    PreviewPlayer.tsx              → Real-time preview of reels project
    AspectRatioSelector.tsx        → 9:16, 1:1, 16:9 presets
    ExportPanel.tsx                → Export/render settings
```

### 20.5 Tasks Breakdown

| # | Task | Priority | Est. Hours |
|---|------|----------|-----------|
| 20.1 | Create Video/Reels DB models + migration | P0 | 4 |
| 20.2 | S3/R2 video storage integration | P0 | 6 |
| 20.3 | Implement `VideoService` (upload, CRUD) | P0 | 10 |
| 20.4 | Video transcoding pipeline (FFmpeg) | P0 | 12 |
| 20.5 | Thumbnail generation service | P1 | 4 |
| 20.6 | Auto-caption AI service (speech-to-text) | P1 | 8 |
| 20.7 | Video publishing to platforms (via social connections) | P0 | 16 |
| 20.8 | Publication scheduling (background jobs) | P1 | 6 |
| 20.9 | Platform metrics sync service | P1 | 8 |
| 20.10 | Create video API endpoints | P0 | 8 |
| 20.11 | Create reels API endpoints | P0 | 6 |
| 20.12 | Build video library page (upload + grid) | P0 | 10 |
| 20.13 | Build video detail/publish page | P0 | 8 |
| 20.14 | Build reels timeline editor (core engine) | P0 | 24 |
| 20.15 | Implement text overlay tools | P1 | 8 |
| 20.16 | Build music browser + audio track | P2 | 6 |
| 20.17 | Reels render/export pipeline | P0 | 10 |
| 20.18 | Music track seed data | P2 | 4 |
| 20.19 | Unit + integration tests | P1 | 8 |
| **Total** | | | **166 hours** |

---

<a id="phase-21"></a>
## Phase 21: Social Platform Connections (Activate Connections)

### 21.1 Overview
Build a unified social media management layer that enables publishing, scheduling, analytics, and engagement across 6 platforms: **Facebook, Instagram, LinkedIn, YouTube, Snapchat**.

> Note: The OAuth connection infrastructure is built in Phase 18. This phase focuses on the **platform-specific functionality** after connection.

### 21.2 Platform Feature Matrix

| Feature | Facebook | Instagram | LinkedIn | YouTube | Snapchat |
|---------|----------|-----------|----------|---------|----------|
| **Connect Account** | Page OAuth | Business OAuth | Company OAuth | Channel OAuth | Marketing API |
| **View Profile** | Page info, followers | Bio, followers, posts | Company info | Channel stats | Account info |
| **Create Post** | Text, image, video, link | Image, carousel, story | Text, image, article | Video upload | Story, Snap Ad |
| **Schedule Post** | Yes | Yes | Yes | Yes (premiere) | Yes |
| **View Analytics** | Page insights | Business insights | Org analytics | Channel/video analytics | Ad analytics |
| **Engagement** | Comments, reactions | Comments, likes | Comments, reactions | Comments, likes | Views |
| **Lead Retrieval** | Lead Forms | - | Lead Gen Forms | - | - |
| **Ad Integration** | Facebook Ads API | Instagram Ads (via FB) | LinkedIn Ads | YouTube Ads (via Google) | Snapchat Ads |

### 21.3 Unified Social Dashboard

```
+--------------------------------------------------------------------+
|  Connected Accounts                            [+ Connect Account]  |
+--------------------------------------------------------------------+
|                                                                      |
|  [FB] Brand Page        [IG] @brand_insta    [LI] Brand Company    |
|  12.5K followers        45.2K followers       8.7K followers        |
|  Last post: 2h ago      Last post: 5h ago     Last post: 1d ago    |
|  [Manage] [Analytics]   [Manage] [Analytics]  [Manage] [Analytics] |
|                                                                      |
|  [YT] Brand Channel     [SC] Brand Snap                             |
|  23.1K subscribers       5.4K friends                                |
|  Last upload: 3d ago     Last story: 12h ago                        |
|  [Manage] [Analytics]   [Manage] [Analytics]                        |
|                                                                      |
+--------------------------------------------------------------------+
|  Unified Feed                                 [Create Post ▼]       |
+--------------------------------------------------------------------+
|                                                                      |
|  📅 Content Calendar (Week View)                                     |
|  +------+------+------+------+------+------+------+                 |
|  | Mon  | Tue  | Wed  | Thu  | Fri  | Sat  | Sun  |                 |
|  | [IG] | [FB] | [LI] |      | [IG] | [YT] |      |                |
|  | Post | Post | Post |      | Reel | Video |      |                |
|  +------+------+------+------+------+------+------+                 |
|                                                                      |
+--------------------------------------------------------------------+
|  Quick Stats (Last 30 Days)                                          |
+--------------------------------------------------------------------+
|  Total Reach: 245.3K | Engagement: 3.2% | Posts: 47 | Leads: 128   |
+--------------------------------------------------------------------+
```

### 21.4 Backend Implementation

#### New Models

```python
# backend/app/models/social_post.py

class SocialPost(Base):
    """Unified social media post"""
    __tablename__ = "social_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)

    # Content
    content_type = Column(String)  # text, image, video, carousel, story, article, reel
    caption = Column(Text, nullable=True)
    media_urls = Column(Text, nullable=True)  # JSON array of media URLs
    link_url = Column(Text, nullable=True)
    hashtags = Column(Text, nullable=True)

    # Targeting
    target_platforms = Column(Text)  # JSON array: ["instagram", "facebook", "linkedin"]

    # Scheduling
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    is_draft = Column(Boolean, default=True)

    # AI Assistance
    ai_generated = Column(Boolean, default=False)
    ai_suggestions_json = Column(Text, nullable=True)  # AI recommended edits

    status = Column(String, default="draft")  # draft, scheduled, publishing, published, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    brand = relationship("Brand")
    campaign = relationship("Campaign")
    platform_posts = relationship("SocialPostPlatform", back_populates="social_post")


class SocialPostPlatform(Base):
    """Platform-specific publication record"""
    __tablename__ = "social_post_platforms"

    id = Column(Integer, primary_key=True, index=True)
    social_post_id = Column(Integer, ForeignKey("social_posts.id"), nullable=False)
    social_connection_id = Column(Integer, ForeignKey("social_connections.id"), nullable=False)

    platform = Column(String, nullable=False)
    platform_post_id = Column(String, nullable=True)
    platform_url = Column(Text, nullable=True)

    # Platform-specific content overrides
    platform_caption = Column(Text, nullable=True)  # Override caption for this platform
    platform_media_json = Column(Text, nullable=True)  # Platform-optimized media

    status = Column(String, default="pending")  # pending, published, failed
    published_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    # Engagement metrics
    impressions = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    saves = Column(Integer, default=0)
    last_metrics_sync = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    social_post = relationship("SocialPost", back_populates="platform_posts")
    social_connection = relationship("SocialConnection")


class ContentCalendarEntry(Base):
    """Calendar view of planned content"""
    __tablename__ = "content_calendar"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)

    title = Column(String)
    description = Column(Text, nullable=True)
    content_type = Column(String)  # post, reel, story, video, blog, email
    platform = Column(String)
    scheduled_date = Column(DateTime(timezone=True))
    color = Column(String, nullable=True)  # Calendar color coding

    # Link to actual content
    social_post_id = Column(Integer, ForeignKey("social_posts.id"), nullable=True)
    video_id = Column(Integer, ForeignKey("video_assets.id"), nullable=True)
    banner_id = Column(Integer, ForeignKey("banner_projects.id"), nullable=True)

    status = Column(String, default="planned")  # planned, created, scheduled, published
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

#### New Service: SocialPublishingService

```python
# backend/app/services/social_publishing_service.py

class SocialPublishingService:
    """Unified social media publishing across all connected platforms"""

    async def create_post(post_data, user_id, brand_id) -> SocialPost:
        """Create a social post (draft or scheduled)"""

    async def publish_now(post_id) -> SocialPost:
        """Immediately publish a post to all target platforms"""

    async def schedule_post(post_id, scheduled_at) -> SocialPost:
        """Schedule post for future publication"""

    async def publish_to_instagram(connection, post) -> SocialPostPlatform:
        """Platform-specific: Publish to Instagram via Graph API"""

    async def publish_to_facebook(connection, post) -> SocialPostPlatform:
        """Platform-specific: Publish to Facebook Page"""

    async def publish_to_linkedin(connection, post) -> SocialPostPlatform:
        """Platform-specific: Publish to LinkedIn Company Page"""

    async def publish_to_youtube(connection, post) -> SocialPostPlatform:
        """Platform-specific: Upload to YouTube"""

    async def publish_to_snapchat(connection, post) -> SocialPostPlatform:
        """Platform-specific: Create Snapchat story/ad"""

    async def sync_all_metrics(brand_id) -> dict:
        """Sync engagement metrics across all platforms"""

    async def get_best_posting_times(brand_id, platform) -> list[dict]:
        """AI-recommended optimal posting times based on historical data"""

    async def get_unified_analytics(brand_id, date_range) -> dict:
        """Aggregate analytics across all connected platforms"""
```

#### New API Endpoints

```
# Social Posts
POST   /api/v1/social/posts                          → Create post (multi-platform)
GET    /api/v1/social/posts                           → List posts (filter by platform/status)
GET    /api/v1/social/posts/{id}                     → Post details + platform metrics
PUT    /api/v1/social/posts/{id}                     → Update post
DELETE /api/v1/social/posts/{id}                     → Delete post
POST   /api/v1/social/posts/{id}/publish             → Publish now
POST   /api/v1/social/posts/{id}/schedule            → Schedule publication

# Content Calendar
GET    /api/v1/social/calendar                        → Calendar entries (date range)
POST   /api/v1/social/calendar                        → Add calendar entry
PUT    /api/v1/social/calendar/{id}                  → Update entry
DELETE /api/v1/social/calendar/{id}                  → Delete entry

# Social Analytics
GET    /api/v1/social/analytics/overview             → Unified analytics dashboard
GET    /api/v1/social/analytics/{platform}           → Platform-specific analytics
GET    /api/v1/social/analytics/best-times           → Optimal posting times
POST   /api/v1/social/analytics/sync                 → Force metrics sync

# Platform-Specific
GET    /api/v1/social/instagram/insights             → Instagram Business insights
GET    /api/v1/social/facebook/page-insights         → Facebook Page insights
GET    /api/v1/social/linkedin/org-insights          → LinkedIn Organization insights
GET    /api/v1/social/youtube/channel-insights       → YouTube channel analytics
```

### 21.5 Frontend Implementation

#### New Pages

```
frontend/src/app/social/
  page.tsx                          → Social dashboard (connected accounts overview)
  posts/page.tsx                    → Post management (list/create)
  posts/create/page.tsx             → Create/compose post
  posts/[id]/page.tsx              → Post detail + metrics
  calendar/page.tsx                → Content calendar view
  analytics/page.tsx               → Unified social analytics
  analytics/[platform]/page.tsx    → Platform-specific analytics
  components/
    ConnectedAccountsGrid.tsx      → Account cards with status
    PostComposer.tsx               → Multi-platform post composer
    PlatformToggle.tsx             → Select target platforms
    ContentCalendar.tsx            → Calendar UI (week/month view)
    CalendarEntry.tsx              → Draggable calendar item
    UnifiedAnalytics.tsx           → Cross-platform metrics charts
    PlatformInsights.tsx           → Platform-specific metrics
    PostMetricsCard.tsx            → Individual post performance
    BestTimesHeatmap.tsx           → Optimal posting times visualization
    HashtagSuggestions.tsx         → AI hashtag recommendations
```

### 21.6 Tasks Breakdown

| # | Task | Priority | Est. Hours |
|---|------|----------|-----------|
| 21.1 | Create social post/calendar DB models + migration | P0 | 4 |
| 21.2 | Implement `SocialPublishingService` | P0 | 16 |
| 21.3 | Facebook publishing integration (Graph API) | P0 | 10 |
| 21.4 | Instagram publishing integration | P0 | 10 |
| 21.5 | LinkedIn publishing integration | P0 | 10 |
| 21.6 | YouTube upload integration | P1 | 10 |
| 21.7 | Snapchat publishing integration | P2 | 8 |
| 21.8 | Scheduled publishing background jobs | P0 | 6 |
| 21.9 | Platform metrics sync background jobs | P1 | 8 |
| 21.10 | Create social post/calendar API endpoints | P0 | 8 |
| 21.11 | Create social analytics API endpoints | P0 | 6 |
| 21.12 | Build social dashboard page | P0 | 8 |
| 21.13 | Build multi-platform post composer | P0 | 12 |
| 21.14 | Build content calendar UI | P0 | 12 |
| 21.15 | Build unified analytics page | P1 | 10 |
| 21.16 | Build platform-specific analytics pages | P1 | 8 |
| 21.17 | AI best posting times + hashtag suggestions | P2 | 6 |
| 21.18 | Unit + integration tests | P1 | 8 |
| **Total** | | | **160 hours** |

---

<a id="phase-22"></a>
## Phase 22: Lead Integrations Hub

### 22.1 Overview
Connect external advertising platforms (Facebook Ads, Google Ads, LinkedIn Ads) to automatically capture and centralize leads generated from ad campaigns into C(AI)DENCE's CRM.

### 22.2 Supported Lead Sources

| Source | Integration Method | Lead Data |
|--------|-------------------|-----------|
| **Facebook Lead Ads** | Facebook Marketing API + Webhooks | Name, email, phone, custom questions |
| **Google Ads Lead Forms** | Google Ads API + webhook | Name, email, phone, form responses |
| **LinkedIn Lead Gen Forms** | LinkedIn Marketing API + webhook | Name, email, company, title, custom |
| **Instagram Lead Ads** | Via Facebook Marketing API | Same as Facebook Lead Ads |
| **Custom Webhook** | Inbound webhook endpoint | Any JSON payload |
| **Zapier/Make** | Webhook trigger | Mapped fields |
| **CSV Import** | File upload | Bulk import |

### 22.3 Lead Flow Architecture

```
                External Platforms
    +----------+    +---------+    +----------+
    | Facebook |    | Google  |    | LinkedIn |
    | Lead Ads |    |Ads Forms|    | Lead Gen |
    +----+-----+    +----+----+    +-----+----+
         |              |               |
         v              v               v
    +----------------------------------------+
    |          Webhook Receiver               |
    |  /api/v1/integrations/webhook/{source}  |
    +-------------------+--------------------+
                        |
                        v
    +----------------------------------------+
    |          Lead Normalization             |
    |  • Field mapping                        |
    |  • Deduplication                        |
    |  • Validation                           |
    |  • Enrichment (optional)                |
    +-------------------+--------------------+
                        |
                        v
    +----------------------------------------+
    |          Lead Storage (CRM)             |
    |  • Lead record created                  |
    |  • Source attribution                   |
    |  • Campaign linkage                     |
    |  • Activity log entry                   |
    +-------------------+--------------------+
                        |
               +--------+--------+
               |                 |
               v                 v
    +------------------+  +------------------+
    |  Notifications   |  |  Automation      |
    |  • Email alert   |  |  • Auto-assign   |
    |  • Push notify   |  |  • Auto-response |
    |  • Slack alert   |  |  • Workflow run   |
    +------------------+  +------------------+
```

### 22.4 Backend Implementation

#### New Models

```python
# backend/app/models/lead.py

class LeadSource(Base):
    """Configured lead source integrations"""
    __tablename__ = "lead_sources"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)

    name = Column(String, nullable=False)  # "Facebook Lead Ads - Summer Campaign"
    source_type = Column(String, nullable=False)  # facebook, google, linkedin, webhook, csv, zapier
    platform_config_json = Column(Text, nullable=True)  # JSON: API keys, form IDs, etc.

    # Webhook configuration
    webhook_url = Column(String, nullable=True)  # Generated inbound webhook URL
    webhook_secret = Column(String, nullable=True)  # For payload verification

    # Field mapping
    field_mapping_json = Column(Text, nullable=True)  # JSON: {source_field: lead_field}

    # Automation
    auto_assign_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    auto_response_template_id = Column(Integer, nullable=True)
    trigger_workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=True)

    # Status
    status = Column(String, default="active")  # active, paused, error, disconnected
    last_lead_at = Column(DateTime(timezone=True), nullable=True)
    total_leads = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization")
    brand = relationship("Brand")
    leads = relationship("Lead", back_populates="source")


class Lead(Base):
    """Captured lead from any source"""
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    source_id = Column(Integer, ForeignKey("lead_sources.id"), nullable=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)

    # Contact Info
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    email = Column(String, index=True, nullable=True)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    job_title = Column(String, nullable=True)

    # Source Attribution
    source_platform = Column(String, nullable=True)  # facebook, google, linkedin, manual, csv
    source_campaign = Column(String, nullable=True)  # Ad campaign name
    source_ad_set = Column(String, nullable=True)  # Ad set/group name
    source_ad = Column(String, nullable=True)  # Specific ad name
    source_form_id = Column(String, nullable=True)  # Platform form ID
    utm_source = Column(String, nullable=True)
    utm_medium = Column(String, nullable=True)
    utm_campaign = Column(String, nullable=True)

    # Lead Details
    custom_fields_json = Column(Text, nullable=True)  # JSON: additional form responses
    raw_payload_json = Column(Text, nullable=True)  # Original webhook payload

    # Qualification
    status = Column(String, default="new")  # new, contacted, qualified, converted, lost
    score = Column(Integer, nullable=True)  # Lead score (0-100)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)

    # Timestamps
    captured_at = Column(DateTime(timezone=True), server_default=func.now())
    contacted_at = Column(DateTime(timezone=True), nullable=True)
    converted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organization = relationship("Organization")
    brand = relationship("Brand")
    source = relationship("LeadSource", back_populates="leads")
    campaign = relationship("Campaign")
    assigned_to = relationship("User")
    activities = relationship("LeadActivity", back_populates="lead")


class LeadActivity(Base):
    """Activity log for lead interactions"""
    __tablename__ = "lead_activities"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    activity_type = Column(String)  # note, email, call, status_change, assignment, auto_response
    description = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="activities")
    user = relationship("User")
```

#### New Service: LeadIntegrationService

```python
# backend/app/services/lead_integration_service.py

class LeadIntegrationService:
    """Manages lead capture integrations and processing"""

    # Source Configuration
    async def create_lead_source(org_id, brand_id, config) -> LeadSource:
        """Create and configure a new lead source"""

    async def generate_webhook_url(source_id) -> str:
        """Generate unique webhook URL for a lead source"""

    # Facebook Lead Ads
    async def connect_facebook_leads(connection_id, page_id, form_ids) -> LeadSource:
        """Connect Facebook Lead Ads forms via Graph API"""

    async def sync_facebook_leads(source_id) -> list[Lead]:
        """Pull new leads from Facebook Lead Ads API"""

    # Google Ads
    async def connect_google_ads(connection_id, customer_id) -> LeadSource:
        """Connect Google Ads lead extensions"""

    async def sync_google_leads(source_id) -> list[Lead]:
        """Pull new leads from Google Ads API"""

    # LinkedIn
    async def connect_linkedin_leads(connection_id, account_id, form_ids) -> LeadSource:
        """Connect LinkedIn Lead Gen Forms"""

    async def sync_linkedin_leads(source_id) -> list[Lead]:
        """Pull new leads from LinkedIn API"""

    # Webhook Processing
    async def process_webhook(source_type, payload, webhook_secret) -> Lead:
        """Process inbound webhook payload into Lead"""

    # Lead Management
    async def normalize_lead(raw_data, field_mapping) -> dict:
        """Normalize raw lead data into standard schema"""

    async def deduplicate_lead(email, phone, org_id) -> Lead | None:
        """Check for existing lead by email/phone"""

    async def score_lead(lead_id) -> int:
        """AI-powered lead scoring based on profile + engagement"""

    async def auto_assign_lead(lead_id, rules) -> Lead:
        """Auto-assign lead based on routing rules"""

    async def bulk_import_csv(file, org_id, brand_id, mapping) -> dict:
        """Bulk import leads from CSV file"""
```

#### New API Endpoints

```
# Lead Source Configuration
POST   /api/v1/integrations/sources                  → Create lead source
GET    /api/v1/integrations/sources                   → List lead sources
GET    /api/v1/integrations/sources/{id}             → Source details + stats
PUT    /api/v1/integrations/sources/{id}             → Update source config
DELETE /api/v1/integrations/sources/{id}             → Delete source
POST   /api/v1/integrations/sources/{id}/sync        → Force sync leads

# Platform-Specific Setup
POST   /api/v1/integrations/facebook/connect          → Connect FB Lead Ads
GET    /api/v1/integrations/facebook/forms             → List available lead forms
POST   /api/v1/integrations/google/connect            → Connect Google Ads
GET    /api/v1/integrations/google/campaigns           → List campaigns with lead forms
POST   /api/v1/integrations/linkedin/connect          → Connect LinkedIn Lead Gen
GET    /api/v1/integrations/linkedin/forms             → List available lead gen forms

# Webhook Endpoints (Inbound)
POST   /api/v1/integrations/webhook/{source_id}      → Receive webhook payload
POST   /api/v1/integrations/webhook/zapier/{token}   → Zapier webhook receiver
POST   /api/v1/integrations/webhook/generic/{token}  → Generic webhook receiver

# Lead Management
GET    /api/v1/leads                                   → List leads (filter/search/sort)
GET    /api/v1/leads/{id}                             → Lead details + activities
PUT    /api/v1/leads/{id}                             → Update lead (status, notes, assign)
DELETE /api/v1/leads/{id}                             → Delete lead
POST   /api/v1/leads/{id}/score                       → AI score lead
POST   /api/v1/leads/{id}/activity                    → Log lead activity
POST   /api/v1/leads/import/csv                       → Bulk CSV import
GET    /api/v1/leads/export                            → Export leads (CSV/JSON)

# Lead Analytics
GET    /api/v1/leads/analytics/overview               → Lead funnel metrics
GET    /api/v1/leads/analytics/sources                → Leads by source breakdown
GET    /api/v1/leads/analytics/trends                 → Lead volume over time
GET    /api/v1/leads/analytics/conversion             → Conversion rates by source/campaign
```

### 22.5 Frontend Implementation

#### New Pages

```
frontend/src/app/leads/
  page.tsx                          → Lead management dashboard
  [id]/page.tsx                     → Lead detail view
  import/page.tsx                   → CSV import wizard
  analytics/page.tsx                → Lead analytics dashboard
  components/
    LeadTable.tsx                   → Filterable, sortable lead table
    LeadDetailPanel.tsx             → Lead profile + activity timeline
    LeadScoreBadge.tsx             → Visual lead score indicator
    LeadActivityLog.tsx            → Activity timeline
    LeadStatusPipeline.tsx         → Kanban-style status pipeline
    SourceBreakdownChart.tsx       → Leads by source chart
    ConversionFunnel.tsx           → Lead funnel visualization
    CSVImportWizard.tsx            → Field mapping import wizard

frontend/src/app/integrations/
  page.tsx                          → Integration hub (connect apps)
  [source]/page.tsx                 → Source-specific setup wizard
  components/
    IntegrationCard.tsx            → Available integration tile
    ConnectWizard.tsx              → Step-by-step connection wizard
    FieldMapper.tsx                → Map source fields to lead fields
    WebhookConfig.tsx              → Webhook URL + secret display
    SyncStatusIndicator.tsx        → Real-time sync status
    IntegrationLogs.tsx            → Recent sync logs/errors
```

#### Integrations Hub UI

```
+--------------------------------------------------------------------+
|  Integrations Hub                           [+ Connect App]         |
+--------------------------------------------------------------------+
|                                                                      |
|  Lead Sources                                                        |
|  +------------------+  +------------------+  +------------------+   |
|  | [FB Icon]        |  | [Google Icon]    |  | [LI Icon]        |   |
|  | Facebook         |  | Google Ads       |  | LinkedIn         |   |
|  | Lead Ads         |  | Lead Forms       |  | Lead Gen Forms   |   |
|  |                  |  |                  |  |                  |   |
|  | 142 leads        |  | 89 leads         |  | 67 leads         |   |
|  | Last: 2h ago     |  | Last: 5h ago     |  | Last: 1d ago     |   |
|  | [Connected]      |  | [Connect]        |  | [Connected]      |   |
|  +------------------+  +------------------+  +------------------+   |
|                                                                      |
|  Other Sources                                                       |
|  +------------------+  +------------------+  +------------------+   |
|  | [Hook Icon]      |  | [Zapier Icon]    |  | [CSV Icon]       |   |
|  | Custom           |  | Zapier           |  | CSV              |   |
|  | Webhook          |  | Integration      |  | Import           |   |
|  |                  |  |                  |  |                  |   |
|  | Endpoint ready   |  | Ready to config  |  | Upload file      |   |
|  | [Configure]      |  | [Connect]        |  | [Import]         |   |
|  +------------------+  +------------------+  +------------------+   |
|                                                                      |
+--------------------------------------------------------------------+
```

### 22.6 Tasks Breakdown

| # | Task | Priority | Est. Hours |
|---|------|----------|-----------|
| 22.1 | Create Lead/LeadSource/LeadActivity DB models + migration | P0 | 4 |
| 22.2 | Implement `LeadIntegrationService` (core) | P0 | 12 |
| 22.3 | Facebook Lead Ads integration (Graph API) | P0 | 12 |
| 22.4 | Google Ads lead form integration | P0 | 12 |
| 22.5 | LinkedIn Lead Gen Forms integration | P0 | 10 |
| 22.6 | Webhook receiver + validation | P0 | 6 |
| 22.7 | Lead normalization + deduplication engine | P0 | 6 |
| 22.8 | AI lead scoring service | P1 | 6 |
| 22.9 | Auto-assign + auto-response rules engine | P1 | 6 |
| 22.10 | CSV import/export service | P1 | 4 |
| 22.11 | Create lead + integration API endpoints | P0 | 10 |
| 22.12 | Lead sync background jobs (polling) | P0 | 6 |
| 22.13 | Build integrations hub page | P0 | 8 |
| 22.14 | Build lead management dashboard | P0 | 10 |
| 22.15 | Build lead detail page | P0 | 6 |
| 22.16 | Build lead analytics page | P1 | 8 |
| 22.17 | Build CSV import wizard | P1 | 6 |
| 22.18 | Build connect wizard for each platform | P0 | 12 |
| 22.19 | Notification system for new leads | P1 | 4 |
| 22.20 | Unit + integration tests | P1 | 10 |
| **Total** | | | **158 hours** |

---

<a id="phase-23"></a>
## Phase 23: Testing & Quality Assurance

### 23.1 Backend Tests

| Area | Test Type | Coverage Target |
|------|-----------|----------------|
| SocialAuthService | Unit + Integration | 90% |
| BannerService | Unit | 85% |
| VideoService | Unit + Integration | 80% |
| SocialPublishingService | Unit + Integration | 85% |
| LeadIntegrationService | Unit + Integration | 90% |
| OAuth Flows | E2E (mocked providers) | 80% |
| Webhook Receiver | Integration | 95% |
| Token Encryption | Unit | 100% |
| Lead Normalization | Unit | 95% |

### 23.2 Frontend Tests

| Area | Test Type | Coverage Target |
|------|-----------|----------------|
| Onboarding Wizard | Unit + E2E | 85% |
| Social Connect Cards | Unit | 90% |
| Post Composer | Unit + E2E | 80% |
| Content Calendar | Unit | 75% |
| Banner Canvas Editor | Unit | 70% |
| Video Uploader | Unit | 80% |
| Lead Table/Pipeline | Unit | 85% |
| Integration Connect Wizards | E2E | 75% |

### 23.3 Tasks Breakdown

| # | Task | Priority | Est. Hours |
|---|------|----------|-----------|
| 23.1 | Backend unit tests for new services | P0 | 20 |
| 23.2 | Backend integration tests (OAuth mocks) | P0 | 12 |
| 23.3 | Frontend unit tests (Vitest) | P0 | 16 |
| 23.4 | Frontend E2E tests (Playwright) | P1 | 16 |
| 23.5 | Webhook security tests | P0 | 4 |
| 23.6 | Load testing (video uploads, concurrent publishing) | P2 | 8 |
| **Total** | | | **76 hours** |

---

<a id="phase-24"></a>
## Phase 24: Performance & Optimization

### 24.1 Areas

| Area | Optimization | Impact |
|------|-------------|--------|
| Video Processing | Queue-based FFmpeg workers | Prevent API blocking |
| Image Generation | CDN caching for exported banners | Faster load times |
| OAuth Tokens | Background refresh before expiry | Zero-downtime connections |
| Lead Sync | Incremental sync with cursors | Reduce API calls |
| Social Analytics | Data caching (Redis, 15min TTL) | Fewer platform API calls |
| Database | Indexing for leads (email, source, status) | Faster CRM queries |
| File Uploads | Presigned URLs for S3 direct upload | Reduce server load |
| WebSocket | Real-time publish status updates | Better UX |

### 24.2 Tasks Breakdown

| # | Task | Priority | Est. Hours |
|---|------|----------|-----------|
| 24.1 | Video transcoding queue (Celery/ARQ workers) | P0 | 8 |
| 24.2 | CDN setup for media assets | P0 | 4 |
| 24.3 | Redis caching for social analytics | P1 | 4 |
| 24.4 | S3 presigned URL upload flow | P0 | 4 |
| 24.5 | Database indexing + query optimization | P1 | 4 |
| 24.6 | WebSocket for real-time status updates | P2 | 6 |
| 24.7 | Background token refresh cron job | P0 | 3 |
| **Total** | | | **33 hours** |

---

<a id="phase-25"></a>
## Phase 25: Deployment & DevOps

### 25.1 Infrastructure

| Component | Service | Purpose |
|-----------|---------|---------|
| Backend API | Docker + Railway/Fly.io | FastAPI application |
| Frontend | Vercel | Next.js hosting + edge functions |
| Database | Supabase / Neon PostgreSQL | Managed PostgreSQL |
| Object Storage | CloudFlare R2 / AWS S3 | Media files (images, videos) |
| CDN | CloudFlare | Media delivery |
| Queue | Redis (Upstash) | Background jobs |
| Video Workers | Dedicated container | FFmpeg processing |
| Monitoring | Sentry + Datadog | Error tracking + APM |
| CI/CD | GitHub Actions | Automated testing + deployment |

### 25.2 Tasks Breakdown

| # | Task | Priority | Est. Hours |
|---|------|----------|-----------|
| 25.1 | Docker compose for new services | P0 | 4 |
| 25.2 | CI/CD pipeline updates (new tests) | P0 | 4 |
| 25.3 | S3/R2 bucket configuration | P0 | 2 |
| 25.4 | CDN configuration | P1 | 2 |
| 25.5 | Environment variable management | P0 | 2 |
| 25.6 | Database migration scripts (production) | P0 | 3 |
| 25.7 | Monitoring + alerting setup | P1 | 4 |
| 25.8 | Load balancer for video workers | P2 | 3 |
| **Total** | | | **24 hours** |

---

## Database Schema Additions

### New Tables Summary

| Table | Phase | Purpose |
|-------|-------|---------|
| `social_connections` | 18 | OAuth tokens for connected social accounts |
| `onboarding_progress` | 18 | Track user onboarding completion |
| `banner_templates` | 19 | Pre-designed banner templates |
| `banner_projects` | 19 | User-created banner projects |
| `video_assets` | 20 | Uploaded/created videos |
| `reels_projects` | 20 | Short-form video editing projects |
| `video_publications` | 20 | Track video publications per platform |
| `music_tracks` | 20 | Royalty-free music library |
| `social_posts` | 21 | Unified social media posts |
| `social_post_platforms` | 21 | Per-platform publication records |
| `content_calendar` | 21 | Content calendar entries |
| `lead_sources` | 22 | Configured lead capture integrations |
| `leads` | 22 | Captured lead records |
| `lead_activities` | 22 | Lead interaction activity log |

**Total New Tables: 14**
**Total Tables After: 44+**

### Entity Relationship (Key Relations)

```
User ─────────── SocialConnection ──── SocialPost
  │                    │                    │
  │                    │               SocialPostPlatform
  │                    │
  ├── OnboardingProgress
  │
  ├── BannerProject ── BannerTemplate
  │
  ├── VideoAsset ───── VideoPublication
  │       │                  │
  │   ReelsProject      SocialConnection
  │
  └── Lead ──────────── LeadSource
        │                    │
    LeadActivity         Organization/Brand
```

---

## API Specification

### New Endpoint Groups Summary

| Group | Base Path | Endpoints | Auth |
|-------|-----------|-----------|------|
| Social Auth | `/api/v1/social/auth` | 2 | JWT |
| Social Connections | `/api/v1/social/connections` | 5 | JWT + RBAC |
| Onboarding | `/api/v1/onboarding` | 4 | JWT |
| Banners | `/api/v1/banners` | 12 | JWT + RBAC |
| Videos | `/api/v1/videos` | 10 | JWT + RBAC |
| Reels | `/api/v1/reels` | 5 | JWT + RBAC |
| Music | `/api/v1/music` | 2 | JWT |
| Social Posts | `/api/v1/social/posts` | 7 | JWT + RBAC |
| Content Calendar | `/api/v1/social/calendar` | 4 | JWT + RBAC |
| Social Analytics | `/api/v1/social/analytics` | 4 | JWT + RBAC |
| Lead Sources | `/api/v1/integrations` | 12 | JWT + RBAC |
| Leads | `/api/v1/leads` | 10 | JWT + RBAC |
| Lead Analytics | `/api/v1/leads/analytics` | 4 | JWT + RBAC |
| Webhooks (Inbound) | `/api/v1/integrations/webhook` | 3 | HMAC/Token |

**Total New Endpoints: ~82**
**Total Endpoints After: ~150+**

---

## Frontend Route Map

### New Routes

| Route | Page | Phase |
|-------|------|-------|
| `/onboarding` | Onboarding wizard (6 steps) | 18 |
| `/banner-studio` | Banner template browser + create | 19 |
| `/banner-studio/editor/[id]` | Canvas banner editor | 19 |
| `/banner-studio/history` | Banner project gallery | 19 |
| `/banner-studio/history/[id]` | Banner project detail | 19 |
| `/video-studio` | Video library + upload | 20 |
| `/video-studio/upload` | Video upload form | 20 |
| `/video-studio/[id]` | Video detail + publish | 20 |
| `/reels-studio` | Reels project list + create | 20 |
| `/reels-studio/editor/[id]` | Reels timeline editor | 20 |
| `/social` | Social dashboard (connections) | 21 |
| `/social/posts` | Post management | 21 |
| `/social/posts/create` | Multi-platform post composer | 21 |
| `/social/posts/[id]` | Post detail + metrics | 21 |
| `/social/calendar` | Content calendar | 21 |
| `/social/analytics` | Unified social analytics | 21 |
| `/social/analytics/[platform]` | Platform analytics | 21 |
| `/leads` | Lead management dashboard | 22 |
| `/leads/[id]` | Lead detail view | 22 |
| `/leads/import` | CSV import wizard | 22 |
| `/leads/analytics` | Lead analytics | 22 |
| `/integrations` | Integration hub | 22 |
| `/integrations/[source]` | Source setup wizard | 22 |

**Total New Routes: 23**
**Total Routes After: 52+**

---

## Security Considerations

### OAuth Token Security
1. **Encryption at Rest** - All OAuth tokens encrypted with Fernet (AES-128-CBC) using `SOCIAL_TOKEN_ENCRYPTION_KEY`
2. **Token Rotation** - Automatic refresh before expiry via background job
3. **Scope Minimization** - Request only necessary OAuth scopes
4. **State Parameter** - CSRF protection via cryptographic state tokens
5. **PKCE** - Proof Key for Code Exchange for public clients (where supported)

### Webhook Security
1. **HMAC Verification** - Verify webhook signatures (Facebook: SHA256, Google: JWT, LinkedIn: SHA256)
2. **IP Allowlisting** - Only accept webhooks from known platform IPs
3. **Replay Protection** - Timestamp validation (reject payloads older than 5 minutes)
4. **Rate Limiting** - Max 100 webhook requests per minute per source
5. **Payload Size Limit** - Max 1MB per webhook payload

### Data Protection
1. **PII Handling** - Lead data (names, emails, phones) encrypted at rest
2. **GDPR Compliance** - Lead deletion, data export, consent tracking
3. **Multi-Tenant Isolation** - All queries scoped to organization_id
4. **Audit Trail** - All lead activities and data access logged
5. **API Rate Limiting** - Per-user and per-organization limits on social API calls

### Media Security
1. **Signed URLs** - Time-limited presigned URLs for S3/R2 access
2. **Content Validation** - File type verification (magic bytes, not just extension)
3. **Size Limits** - Image: 10MB, Video: 500MB, Banner Export: 5MB
4. **Virus Scanning** - ClamAV scan on video/image uploads (optional)
5. **CDN Token Auth** - Prevent unauthorized hotlinking

---

<a id="timeline-milestones"></a>
## Timeline & Milestones

### Phase Duration Estimates

| Phase | Description | Hours | Weeks (1 dev) | Weeks (2 devs) |
|-------|------------|-------|---------------|----------------|
| **18** | Onboarding + Social Connect | 83 | 2.5 | 1.5 |
| **19** | Nano Banner Engine | 106 | 3 | 2 |
| **20** | Video & Reels Studio | 166 | 5 | 3 |
| **21** | Social Platform Connections | 160 | 4.5 | 2.5 |
| **22** | Lead Integrations Hub | 158 | 4.5 | 2.5 |
| **23** | Testing & QA | 76 | 2 | 1.5 |
| **24** | Performance & Optimization | 33 | 1 | 0.5 |
| **25** | Deployment & DevOps | 24 | 1 | 0.5 |
| **TOTAL** | | **806** | **23.5 weeks** | **14 weeks** |

### Recommended Execution Order

```
Month 1-2:   Phase 18 (Onboarding) → Phase 21 (Social Connections)
             ├─ Onboarding gets users connected fast
             └─ Social connections unlock Phases 20-22

Month 2-3:   Phase 19 (Banners) → Phase 20 (Video/Reels)
             ├─ Banner engine leverages existing Design Studio
             └─ Video studio needs social connections from Phase 21

Month 3-4:   Phase 22 (Lead Integrations)
             └─ Full CRM lead pipeline with connected platforms

Month 4-5:   Phase 23 (Testing) → Phase 24 (Performance) → Phase 25 (Deploy)
             └─ Harden, optimize, ship to production
```

### Critical Path

```
Phase 18 (OAuth infra) ──→ Phase 21 (Publishing) ──→ Phase 20 (Video Publish)
                       └──→ Phase 22 (Lead APIs)

Phase 19 (Banners) is independent and can be parallelized
Phase 23-25 run sequentially at the end
```

### Milestones & Checkpoints

| Milestone | Target | Criteria |
|-----------|--------|----------|
| **M1: First Social Connect** | Week 2 | User can OAuth connect Instagram + see profile |
| **M2: Onboarding Complete** | Week 3 | Full 6-step onboarding wizard functional |
| **M3: First Banner** | Week 5 | User can create + export a banner from template |
| **M4: Social Publishing** | Week 7 | User can compose + publish a post to 2+ platforms |
| **M5: Content Calendar** | Week 8 | Scheduling + calendar view operational |
| **M6: Video Upload + Publish** | Week 10 | Video upload + transcode + publish to YouTube/IG |
| **M7: Reels Editor MVP** | Week 12 | Basic timeline editor + export |
| **M8: First Lead Captured** | Week 14 | FB Lead Ad captured in system via webhook |
| **M9: Lead Pipeline** | Week 16 | Full lead management with scoring + assignment |
| **M10: Production Ready** | Week 20 | All phases tested, optimized, deployed |

---

## Appendix A: Third-Party API Requirements

| API | Required Credentials | Rate Limits | Documentation |
|-----|---------------------|-------------|---------------|
| Facebook Graph API v19.0 | App ID, App Secret | 200 calls/hour/user | developers.facebook.com |
| Instagram Graph API | Via Facebook App | 200 calls/hour/user | developers.facebook.com/docs/instagram-api |
| WhatsApp Business API | Via Facebook App | Varies by tier | developers.facebook.com/docs/whatsapp |
| Google OAuth 2.0 | Client ID, Client Secret | 10,000 calls/day | console.cloud.google.com |
| YouTube Data API v3 | Via Google Cloud | 10,000 units/day | developers.google.com/youtube |
| LinkedIn Marketing API | App ID, App Secret | 100 calls/day/member | learn.microsoft.com/en-us/linkedin |
| Snapchat Marketing API | Client ID, Client Secret | 1,000 calls/minute | marketingapi.snapchat.com |
| Google Ads API | Developer Token, Client ID | 15,000 operations/day | developers.google.com/google-ads/api |

## Appendix B: Environment Variables (All New)

```env
# === Phase 18: Social OAuth ===
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
SNAPCHAT_CLIENT_ID=
SNAPCHAT_CLIENT_SECRET=
SOCIAL_TOKEN_ENCRYPTION_KEY=

# === Phase 19-20: Media Storage ===
S3_BUCKET_NAME=caidence-media
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=us-east-1
S3_ENDPOINT_URL=  # For CloudFlare R2 compatibility
CDN_BASE_URL=https://media.caidence.ai

# === Phase 20: Video Processing ===
FFMPEG_PATH=/usr/bin/ffmpeg
VIDEO_MAX_UPLOAD_MB=500
VIDEO_TRANSCODE_QUEUE=video-processing

# === Phase 22: Lead Integrations ===
GOOGLE_ADS_DEVELOPER_TOKEN=
WEBHOOK_BASE_URL=https://api.caidence.ai/api/v1/integrations/webhook
WEBHOOK_HMAC_SECRET=

# === Phase 24: Caching ===
REDIS_CACHE_TTL=900  # 15 minutes for social analytics cache
```

---

*This document serves as the comprehensive project plan for C(AI)DENCE phases 18-25. Each phase should be executed with PR-based code reviews, incremental testing, and milestone checkpoints as outlined above.*
