# ABC Profiles - Detailed Implementation Plan

> **A** = Agency Profile | **B** = Brand Profile | **C** = Creator Profile
> C(AI)DENCE Marketing Intelligence Suite
> Created: February 2026

---

## 1. Executive Summary

This document provides a granular, task-by-task implementation plan for building three distinct profile types within C(AI)DENCE, each with dedicated onboarding, social account connections, and role-specific dashboards.

### Current State vs Target State

| Aspect | Current State | Target State |
|--------|--------------|--------------|
| **Agency Profile** | Basic `Organization` model (name, slug, logo, plan_tier). No dedicated profile page. Agency page only shows brand list. | Rich agency profile with company details, team overview, social presence, branding kit, billing info, and agency-level analytics dashboard. |
| **Brand Profile** | Minimal `Brand` model (name, slug, logo, industry, description). Created via simple modal. | Full brand profile with target audience, brand guidelines, social accounts, content preferences, competitor tracking, and brand health metrics. |
| **Creator Profile** | `Creator` model with basic fields. Portal shows mock data. No self-registration or social auth. | Complete creator profile with multi-platform social verification, media kit, portfolio, earnings dashboard, content calendar, and direct messaging. |
| **Social Connections** | UI-only `SocialAccountsSettings` with fake toggle (no backend). No OAuth. | Full OAuth2 flows for Instagram, WhatsApp, Facebook, LinkedIn, YouTube, Snapchat with token storage and refresh. |
| **Onboarding** | Register → direct redirect to dashboard. No guided flow. | 3 separate onboarding wizards tailored per profile type (A/B/C). |

---

## 2. Profile Type Definitions

### 2.1 Agency Profile (A)

**Who**: Marketing agencies, consulting firms, media companies managing multiple brands and creator rosters.

**Profile Sections:**

| Section | Fields | Data Type |
|---------|--------|-----------|
| **Company Info** | Agency Name, Legal Entity Name, Tax ID/GST, Registration Number | String |
| **Contact** | Primary Email, Phone, Address (Street, City, State, Country, ZIP) | String |
| **Branding** | Logo (URL), Brand Colors (Primary, Secondary, Accent), Fonts (Heading, Body) | String/JSON |
| **About** | Agency Bio/Description, Founded Year, Company Size (1-10, 11-50, 51-200, 200+), Specializations (tags) | Text/JSON |
| **Industry** | Primary Industry, Secondary Industries | String/JSON |
| **Web Presence** | Website URL, LinkedIn Company Page, Facebook Page, Instagram Handle, Twitter/X Handle, YouTube Channel | String |
| **Social Connections** | Connected OAuth accounts (Instagram, Facebook, LinkedIn, YouTube, WhatsApp, Snapchat) | FK → SocialConnection |
| **Billing** | Plan Tier (free/pro/enterprise), Billing Email, Payment Method, Subscription Status | String |
| **Team** | Team Size, Departments, Key Contacts | FK → Team/User |
| **White-Label** | Custom Domain, Login Background, Email Templates, Report Branding | String/JSON |
| **Documents** | Certifications, Awards, Case Studies (uploaded files) | JSON/URLs |

### 2.2 Brand Profile (B)

**Who**: Individual brands/companies managed by an agency OR self-managed brand accounts.

**Profile Sections:**

| Section | Fields | Data Type |
|---------|--------|-----------|
| **Brand Identity** | Brand Name, Tagline, Logo (URL), Cover Image, Brand Colors (Primary, Secondary, Accent) | String |
| **Company Info** | Legal Entity, Parent Company (Agency), Industry, Sub-Industry | String/FK |
| **About** | Brand Description, Mission Statement, Brand Voice (formal/casual/playful/authoritative), Brand Values (tags) | Text/JSON |
| **Target Audience** | Age Range (min-max), Gender Split (%), Locations (countries/cities), Interests (tags), Income Level | JSON |
| **Web Presence** | Website URL, Blog URL, E-commerce URL | String |
| **Social Accounts** | Instagram (handle + OAuth), Facebook Page (+ OAuth), LinkedIn Page (+ OAuth), YouTube Channel (+ OAuth), TikTok (handle), Snapchat (+ OAuth), WhatsApp Business (+ OAuth), Twitter/X (handle), Pinterest (handle) | FK → SocialConnection |
| **Content Preferences** | Preferred Content Types (image/video/reel/story/blog), Posting Frequency per Platform, Content Pillars (tags), Hashtag Strategy | JSON |
| **Competitor Tracking** | Competitor Brands (list with social handles), Benchmark Metrics | JSON |
| **Brand Guidelines** | Do's and Don'ts (text), Approved Hashtags, Restricted Words, Tone Guidelines | Text/JSON |
| **Campaign History** | Linked Campaigns, Total Spend, ROI Metrics | FK → Campaign |
| **Creator Roster** | Linked Creators, Status per Creator | FK → Creator |

### 2.3 Creator Profile (C)

**Who**: Influencers, content creators, talent managed by brands/agencies OR self-registered creators.

**Profile Sections:**

| Section | Fields | Data Type |
|---------|--------|-----------|
| **Personal Info** | Full Name, Display Name, Email, Phone, Date of Birth, Gender, Location (City, Country) | String |
| **Profile** | Bio, Profile Picture (URL), Cover Image, Niche/Category (Fashion, Tech, Fitness, etc.), Tags | String/Text/JSON |
| **Social Platforms** | Instagram (handle + OAuth + metrics), YouTube (channel + OAuth + metrics), Facebook (page + OAuth), TikTok (handle + metrics), LinkedIn (profile + OAuth), Snapchat (handle + OAuth), Twitter/X (handle), WhatsApp Business (+ OAuth), Pinterest (handle) | FK → SocialConnection |
| **Audience Metrics** | Total Followers (aggregated), Total Engagement Rate, Audience Demographics (age, gender, location), Audience Growth Rate | Float/JSON |
| **Content Stats** | Total Posts, Avg Likes, Avg Comments, Avg Views, Posting Frequency, Top Performing Content | Integer/Float/JSON |
| **Classification** | Tier (Nano <10K, Micro 10-100K, Macro 100K-1M, Mega 1M+), Category, Content Style Tags | String/JSON |
| **Rates & Pricing** | Rate Card (per post type per platform), Minimum Campaign Budget, Currency Preference | JSON |
| **Portfolio** | Media Kit (PDF/URL), Portfolio Images, Portfolio Videos, Case Studies, Testimonials | JSON/URLs |
| **Affiliate** | Affiliate Code, Commission Rate, Total Earnings, Payout History | String/Float |
| **Availability** | Availability Status (available/busy/not_accepting), Preferred Content Types, Preferred Brands/Industries, Blacklisted Brands | String/JSON |
| **Contracts** | Active Contracts, Contract Status, Contract Documents | JSON/URLs |
| **Banking** | Payout Method (bank/paypal/stripe), Payout Details (encrypted), Tax Info | Encrypted/JSON |

---

## 3. Database Schema Changes

### 3.1 Agency Profile Extension (ALTER `organizations` table + new `agency_profiles` table)

```sql
-- New table: agency_profiles (extends organizations with rich profile data)
CREATE TABLE agency_profiles (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER UNIQUE NOT NULL REFERENCES organizations(id),

    -- Company Info
    legal_entity_name VARCHAR(255),
    tax_id VARCHAR(100),
    registration_number VARCHAR(100),

    -- Contact
    primary_email VARCHAR(255),
    phone VARCHAR(50),
    address_street TEXT,
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_country VARCHAR(100),
    address_zip VARCHAR(20),

    -- About
    description TEXT,
    founded_year INTEGER,
    company_size VARCHAR(50),  -- '1-10', '11-50', '51-200', '200+'
    specializations JSONB,     -- ["influencer_marketing", "social_media", "content"]

    -- Web Presence
    website_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    facebook_url VARCHAR(500),
    instagram_handle VARCHAR(255),
    twitter_handle VARCHAR(255),
    youtube_url VARCHAR(500),

    -- White Label
    login_background_url TEXT,
    email_header_url TEXT,
    report_logo_url TEXT,
    custom_css TEXT,

    -- Documents
    certifications JSONB,     -- [{name, url, issued_date}]
    awards JSONB,             -- [{name, year, url}]
    case_studies JSONB,       -- [{title, url, description}]

    -- Profile Completion
    profile_completion_pct INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### 3.2 Brand Profile Extension (ALTER `brands` table + new `brand_profiles` table)

```sql
-- New table: brand_profiles (extends brands with rich profile data)
CREATE TABLE brand_profiles (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER UNIQUE NOT NULL REFERENCES brands(id),

    -- Brand Identity
    tagline VARCHAR(500),
    cover_image_url TEXT,
    brand_colors JSONB,       -- {primary: "#...", secondary: "#...", accent: "#..."}
    brand_fonts JSONB,        -- {heading: "Inter", body: "Open Sans"}

    -- About
    mission_statement TEXT,
    brand_voice VARCHAR(50),  -- formal, casual, playful, authoritative
    brand_values JSONB,       -- ["sustainability", "innovation", "quality"]

    -- Target Audience
    audience_age_min INTEGER,
    audience_age_max INTEGER,
    audience_gender_split JSONB,  -- {male: 40, female: 55, other: 5}
    audience_locations JSONB,      -- ["US", "UK", "India"]
    audience_interests JSONB,      -- ["technology", "fashion", "fitness"]
    audience_income_level VARCHAR(50),  -- low, medium, high, luxury

    -- Web Presence
    website_url VARCHAR(500),
    blog_url VARCHAR(500),
    ecommerce_url VARCHAR(500),

    -- Social Handles (non-OAuth, for reference)
    tiktok_handle VARCHAR(255),
    twitter_handle VARCHAR(255),
    pinterest_handle VARCHAR(255),

    -- Content Preferences
    preferred_content_types JSONB,  -- ["image", "video", "reel", "story"]
    posting_frequency JSONB,        -- {instagram: "daily", linkedin: "3x_week"}
    content_pillars JSONB,          -- ["product", "lifestyle", "education", "behind_scenes"]
    hashtag_strategy JSONB,         -- {branded: ["#brand"], community: ["#topic"]}

    -- Competitor Tracking
    competitors JSONB,  -- [{name, instagram, facebook, notes}]

    -- Brand Guidelines
    brand_dos TEXT,
    brand_donts TEXT,
    approved_hashtags JSONB,
    restricted_words JSONB,
    tone_guidelines TEXT,

    -- Profile Completion
    profile_completion_pct INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### 3.3 Creator Profile Extension (ALTER `creators` table + new `creator_profiles` table)

```sql
-- New table: creator_profiles (extends creators with rich profile data)
CREATE TABLE creator_profiles (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER UNIQUE NOT NULL REFERENCES creators(id),

    -- Personal Info
    display_name VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(50),
    city VARCHAR(100),
    country VARCHAR(100),
    languages JSONB,  -- ["English", "Hindi", "Spanish"]

    -- Profile
    cover_image_url TEXT,
    niche_primary VARCHAR(100),
    niche_secondary VARCHAR(100),
    content_style_tags JSONB,  -- ["minimalist", "high_energy", "cinematic"]

    -- Audience Metrics (aggregated from social connections)
    total_followers INTEGER DEFAULT 0,
    total_engagement_rate FLOAT DEFAULT 0.0,
    audience_demographics JSONB,  -- {age: {...}, gender: {...}, location: {...}}
    audience_growth_rate FLOAT DEFAULT 0.0,

    -- Content Stats (aggregated)
    total_posts INTEGER DEFAULT 0,
    avg_likes INTEGER DEFAULT 0,
    avg_comments INTEGER DEFAULT 0,
    avg_views INTEGER DEFAULT 0,
    posting_frequency FLOAT DEFAULT 0.0,  -- posts per week
    top_performing_content JSONB,  -- [{url, platform, engagement}]

    -- Rates & Pricing
    rate_card JSONB,  -- {instagram_post: 500, instagram_reel: 800, youtube_video: 2000}
    minimum_campaign_budget FLOAT,
    currency VARCHAR(10) DEFAULT 'USD',

    -- Portfolio
    media_kit_url TEXT,
    portfolio_images JSONB,   -- [url1, url2, ...]
    portfolio_videos JSONB,   -- [url1, url2, ...]
    case_studies JSONB,       -- [{brand, campaign, results, url}]
    testimonials JSONB,       -- [{brand, quote, rating}]

    -- Availability
    availability_status VARCHAR(50) DEFAULT 'available',  -- available, busy, not_accepting
    preferred_content_types JSONB,  -- ["reel", "story", "post"]
    preferred_industries JSONB,     -- ["fashion", "tech", "fitness"]
    blacklisted_brands JSONB,       -- [brand_id1, brand_id2]

    -- Banking (encrypted)
    payout_method VARCHAR(50),  -- bank, paypal, stripe
    payout_details_encrypted TEXT,
    tax_info_encrypted TEXT,

    -- Profile Completion
    profile_completion_pct INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### 3.4 Social Connections (Shared across all 3 profiles)

```sql
-- Shared: social_connections table (from Phase 18 of PROJECT_PLAN.md)
CREATE TABLE social_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    organization_id INTEGER REFERENCES organizations(id),
    brand_id INTEGER REFERENCES brands(id),
    creator_id INTEGER REFERENCES creators(id),

    platform VARCHAR(50) NOT NULL,  -- instagram, facebook, whatsapp, linkedin, youtube, snapchat
    platform_user_id VARCHAR(255),
    platform_username VARCHAR(255),
    platform_display_name VARCHAR(255),
    platform_avatar_url TEXT,

    -- OAuth tokens (encrypted)
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    scopes TEXT,              -- JSON array of granted scopes
    account_type VARCHAR(50), -- personal, business, creator
    page_id VARCHAR(255),
    page_name VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'active',  -- active, expired, revoked, error
    last_sync_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    -- Metrics snapshot (pulled from platform)
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    engagement_rate FLOAT DEFAULT 0.0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(user_id, platform, brand_id, creator_id)
);

-- Onboarding progress per profile type
CREATE TABLE onboarding_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),

    profile_type VARCHAR(20) NOT NULL,  -- agency, brand, creator
    current_step INTEGER DEFAULT 1,

    -- Step completion (JSON for flexibility per profile type)
    steps_completed JSONB DEFAULT '{}',
    -- Agency: {company_info, branding, social_connect, team_invite, billing}
    -- Brand:  {brand_identity, audience, social_connect, guidelines, content_prefs}
    -- Creator: {personal_info, social_connect, portfolio, rates, availability}

    skipped_steps JSONB DEFAULT '[]',
    completed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

---

## 4. Onboarding Flows (Per Profile Type)

### 4.1 Agency Onboarding (A)

```
Step 1: Account Type Selection
+--------------------------------------------------+
|  Welcome to C(AI)DENCE!                          |
|  How would you like to use the platform?          |
|                                                    |
|  [A] I'm an Agency / Company                      |
|      Manage multiple brands & creator rosters     |
|                                                    |
|  [B] I'm a Brand                                  |
|      Manage my brand's social & marketing         |
|                                                    |
|  [C] I'm a Creator / Influencer                   |
|      Manage my content, collabs & earnings        |
+--------------------------------------------------+

Step 2: Company Information
+--------------------------------------------------+
|  Tell us about your agency                        |
|  ┌──────────────────────────────────────────┐    |
|  │  Agency Name*         [________________]  │    |
|  │  Legal Entity Name    [________________]  │    |
|  │  Industry*            [____Select____▼]   │    |
|  │  Company Size*        [____Select____▼]   │    |
|  │  Founded Year         [______]            │    |
|  │  Website URL          [________________]  │    |
|  │  Description          [________________]  │    |
|  │                       [________________]  │    |
|  └──────────────────────────────────────────┘    |
|                          [Back]  [Continue →]     |
+--------------------------------------------------+

Step 3: Branding & Identity
+--------------------------------------------------+
|  Set up your brand identity                       |
|  ┌──────────────────────────────────────────┐    |
|  │  [Upload Logo]    [Upload Cover]          │    |
|  │                                           │    |
|  │  Primary Color    [#______] [■]           │    |
|  │  Secondary Color  [#______] [■]           │    |
|  │  Accent Color     [#______] [■]           │    |
|  │                                           │    |
|  │  Custom Domain    [___________.com]       │    |
|  └──────────────────────────────────────────┘    |
|                          [Back]  [Continue →]     |
+--------------------------------------------------+

Step 4: Connect Social Accounts
+--------------------------------------------------+
|  Connect your agency's social presence            |
|                                                    |
|  [Instagram]  Connect Business Account    [→]     |
|  [Facebook]   Connect Page                [→]     |
|  [LinkedIn]   Connect Company Page        [→]     |
|  [YouTube]    Connect Channel             [→]     |
|  [WhatsApp]   Connect Business API        [→]     |
|  [Snapchat]   Connect Marketing API       [→]     |
|                                                    |
|  Connected: 0/6                                    |
|                          [Back]  [Skip]  [Next →] |
+--------------------------------------------------+

Step 5: Invite Team Members
+--------------------------------------------------+
|  Build your team                                  |
|  ┌──────────────────────────────────────────┐    |
|  │  Email              Role                  │    |
|  │  [____________]     [Admin      ▼]  [+]  │    |
|  │                                           │    |
|  │  Pending Invitations:                     │    |
|  │  john@agency.com     Admin    [Resend]    │    |
|  │  sara@agency.com     Manager  [Resend]    │    |
|  │                                           │    |
|  │  Or share invite link:                    │    |
|  │  https://app.caidence.ai/join/abc123 [📋] │    |
|  └──────────────────────────────────────────┘    |
|                          [Back]  [Skip]  [Next →] |
+--------------------------------------------------+

Step 6: Create First Brand
+--------------------------------------------------+
|  Add your first brand                             |
|  ┌──────────────────────────────────────────┐    |
|  │  Brand Name*        [________________]    │    |
|  │  Industry           [____Select____▼]     │    |
|  │  Description        [________________]    │    |
|  │  Website URL        [________________]    │    |
|  └──────────────────────────────────────────┘    |
|                          [Back]  [Skip]  [🚀 Launch] |
+--------------------------------------------------+
```

### 4.2 Brand Onboarding (B)

```
Step 1: Account Type (shared - select "Brand")

Step 2: Brand Identity
+--------------------------------------------------+
|  Set up your brand                                |
|  ┌──────────────────────────────────────────┐    |
|  │  Brand Name*        [________________]    │    |
|  │  Tagline            [________________]    │    |
|  │  [Upload Logo]    [Upload Cover]          │    |
|  │  Industry*          [____Select____▼]     │    |
|  │  Website URL        [________________]    │    |
|  │  Brand Description  [________________]    │    |
|  └──────────────────────────────────────────┘    |
|                          [Back]  [Continue →]     |
+--------------------------------------------------+

Step 3: Target Audience
+--------------------------------------------------+
|  Define your audience                             |
|  ┌──────────────────────────────────────────┐    |
|  │  Age Range          [18 ▼] to [45 ▼]     │    |
|  │  Gender Focus       [All ▼]               │    |
|  │  Primary Locations  [+Add Country/City]   │    |
|  │    📍 United States  📍 United Kingdom     │    |
|  │  Interests          [+Add Interest]       │    |
|  │    🏷 Technology  🏷 Lifestyle  🏷 Gaming   │    |
|  │  Income Level       [____Select____▼]     │    |
|  └──────────────────────────────────────────┘    |
|                          [Back]  [Continue →]     |
+--------------------------------------------------+

Step 4: Connect Social Accounts
+--------------------------------------------------+
|  Connect your brand's social accounts             |
|                                                    |
|  [Instagram]  Connect Business Account    [→]     |
|  [Facebook]   Connect Brand Page          [→]     |
|  [LinkedIn]   Connect Company Page        [→]     |
|  [YouTube]    Connect Channel             [→]     |
|  [WhatsApp]   Connect Business            [→]     |
|  [Snapchat]   Connect Account             [→]     |
|  [TikTok]     Enter Handle:  [@_________]         |
|  [Twitter/X]  Enter Handle:  [@_________]         |
|  [Pinterest]  Enter Handle:  [@_________]         |
|                                                    |
|                          [Back]  [Skip]  [Next →] |
+--------------------------------------------------+

Step 5: Brand Guidelines
+--------------------------------------------------+
|  Set brand guidelines                             |
|  ┌──────────────────────────────────────────┐    |
|  │  Brand Voice        [____Select____▼]     │    |
|  │    formal / casual / playful / authoritative  │
|  │  Brand Values       [+Add Value]          │    |
|  │    🏷 Innovation  🏷 Quality              │    |
|  │  Approved Hashtags  [+Add]                │    |
|  │    #BrandName  #BrandCampaign             │    |
|  │  Content Pillars    [+Add]                │    |
|  │    📌 Product  📌 Lifestyle  📌 Education │    |
|  └──────────────────────────────────────────┘    |
|                          [Back]  [Skip]  [🚀 Launch] |
+--------------------------------------------------+
```

### 4.3 Creator Onboarding (C)

```
Step 1: Account Type (shared - select "Creator")

Step 2: Personal Info
+--------------------------------------------------+
|  Tell us about yourself                           |
|  ┌──────────────────────────────────────────┐    |
|  │  [Upload Profile Photo]                   │    |
|  │                                           │    |
|  │  Full Name*         [________________]    │    |
|  │  Display Name       [________________]    │    |
|  │  Location           [City, Country]       │    |
|  │  Niche/Category*    [____Select____▼]     │    |
|  │  Bio                [________________]    │    |
|  │                     [________________]    │    |
|  └──────────────────────────────────────────┘    |
|                          [Back]  [Continue →]     |
+--------------------------------------------------+

Step 3: Connect Social Platforms
+--------------------------------------------------+
|  Connect your platforms (at least 1 required)     |
|                                                    |
|  ★ Connect at least one platform to verify your   |
|    identity and pull your audience metrics.        |
|                                                    |
|  [Instagram]  Connect Creator Account     [→]     |
|  [YouTube]    Connect Channel             [→]     |
|  [TikTok]     Enter Handle:  [@_________]         |
|  [Facebook]   Connect Page                [→]     |
|  [LinkedIn]   Connect Profile             [→]     |
|  [Snapchat]   Connect Account             [→]     |
|  [Twitter/X]  Enter Handle:  [@_________]         |
|  [WhatsApp]   Connect Business            [→]     |
|                                                    |
|  ✅ Instagram connected: @creator_handle (45K)    |
|  Connected: 1/8  (Minimum 1 required)             |
|                          [Back]  [Continue →]     |
+--------------------------------------------------+

Step 4: Portfolio & Media Kit
+--------------------------------------------------+
|  Showcase your work                               |
|  ┌──────────────────────────────────────────┐    |
|  │  Upload Media Kit   [📄 Upload PDF]       │    |
|  │                                           │    |
|  │  Portfolio Highlights (drag & drop)       │    |
|  │  [+Add Image/Video]                       │    |
|  │  ┌──────┐ ┌──────┐ ┌──────┐             │    |
|  │  │ 📷   │ │ 🎬   │ │ 📷   │             │    |
|  │  │ img1 │ │ vid1 │ │ img2 │             │    |
|  │  └──────┘ └──────┘ └──────┘             │    |
|  │                                           │    |
|  │  Best Work Links:                         │    |
|  │  [+ Add URL to your best content]         │    |
|  └──────────────────────────────────────────┘    |
|                          [Back]  [Skip]  [Next →] |
+--------------------------------------------------+

Step 5: Rates & Availability
+--------------------------------------------------+
|  Set your rates                                   |
|  ┌──────────────────────────────────────────┐    |
|  │  Currency          [USD ▼]                │    |
|  │                                           │    |
|  │  Rate Card:                               │    |
|  │  Instagram Post    [$________]            │    |
|  │  Instagram Reel    [$________]            │    |
|  │  Instagram Story   [$________]            │    |
|  │  YouTube Video     [$________]            │    |
|  │  TikTok Video      [$________]            │    |
|  │  Blog Post         [$________]            │    |
|  │                                           │    |
|  │  Minimum Budget    [$________]            │    |
|  │  Availability      [Available ▼]         │    |
|  │                                           │    |
|  │  Preferred Industries [+Add]              │    |
|  │    🏷 Fashion  🏷 Tech                    │    |
|  └──────────────────────────────────────────┘    |
|                          [Back]  [Skip]  [🚀 Launch] |
+--------------------------------------------------+
```

---

## 5. Detailed Implementation Tasks

### 5.1 PHASE A: Foundation & Shared Infrastructure

| Task ID | Task | Description | Backend/Frontend | Files to Create/Modify | Est. Hours |
|---------|------|-------------|-----------------|----------------------|-----------|
| A-001 | Profile type selector on registration | Add radio/card selection: Agency/Brand/Creator on register page | Frontend | `frontend/src/app/register/page.tsx` | 3 |
| A-002 | Update User model with `profile_type` field | Add `profile_type` column (agency/brand/creator) to User model | Backend | `backend/app/models/models.py` | 1 |
| A-003 | Create `SocialConnection` model | OAuth token storage for all 6 platforms | Backend | `backend/app/models/social_connection.py` (new) | 3 |
| A-004 | Create `OnboardingProgress` model | Track onboarding steps per user/profile type | Backend | `backend/app/models/onboarding.py` (new) | 2 |
| A-005 | Token encryption utility | Fernet-based encrypt/decrypt for OAuth tokens at rest | Backend | `backend/app/core/encryption.py` (new) | 3 |
| A-006 | Alembic migration for all new tables | `agency_profiles`, `brand_profiles`, `creator_profiles`, `social_connections`, `onboarding_progress`, User `profile_type` column | Backend | `backend/alembic/versions/xxx_abc_profiles.py` (new) | 3 |
| A-007 | SocialAuthService - OAuth2 flows | Initiate/callback/refresh for all 6 platforms | Backend | `backend/app/services/social_auth_service.py` (new) | 14 |
| A-008 | Social auth API endpoints | `/api/v1/social/auth/{platform}`, `/api/v1/social/callback/{platform}`, connections CRUD | Backend | `backend/app/api/endpoints/social_auth.py` (new) | 8 |
| A-009 | Onboarding API endpoints | Progress tracking, step completion, skip | Backend | `backend/app/api/endpoints/onboarding.py` (new) | 4 |
| A-010 | Frontend API layer for social auth | `social.ts` - OAuth initiate, list connections, disconnect | Frontend | `frontend/src/lib/api/social.ts` (new) | 3 |
| A-011 | Frontend API layer for onboarding | `onboarding.ts` - progress, step complete, skip | Frontend | `frontend/src/lib/api/onboarding.ts` (new) | 2 |
| A-012 | Shared SocialConnectCard component | Reusable OAuth connect/disconnect card for all 6 platforms | Frontend | `frontend/src/components/social/SocialConnectCard.tsx` (new) | 4 |
| A-013 | Shared SocialConnectGrid component | Grid of 6 platform cards with status indicators | Frontend | `frontend/src/components/social/SocialConnectGrid.tsx` (new) | 3 |
| A-014 | Profile completion calculator utility | Calculate % complete based on filled fields per profile type | Backend | `backend/app/utils/profile_completion.py` (new) | 2 |
| A-015 | Update register endpoint for profile_type | Accept `profile_type` in registration, create corresponding profile record | Backend | `backend/app/api/endpoints/auth.py` (modify) | 3 |
| A-016 | Redirect logic after registration | Route to correct onboarding wizard based on profile_type | Frontend | `frontend/src/app/register/page.tsx` (modify) | 2 |
| **Subtotal** | | | | | **60 hrs** |

### 5.2 PHASE B: Agency Profile (A)

| Task ID | Task | Description | Backend/Frontend | Files to Create/Modify | Est. Hours |
|---------|------|-------------|-----------------|----------------------|-----------|
| B-001 | Create `AgencyProfile` SQLAlchemy model | All fields from Section 3.1 | Backend | `backend/app/models/agency_profile.py` (new) | 3 |
| B-002 | Agency profile Pydantic schemas | Create, Update, Response schemas | Backend | `backend/app/schemas/agency_schemas.py` (new) | 2 |
| B-003 | Agency profile service | CRUD operations, profile completion calc, verification | Backend | `backend/app/services/agency_profile_service.py` (new) | 6 |
| B-004 | Agency profile API endpoints | GET/PUT profile, GET completion %, upload logo/docs | Backend | `backend/app/api/endpoints/agency_profile.py` (new) | 5 |
| B-005 | Agency onboarding wizard (6 steps) | Full wizard component with step navigation and progress | Frontend | `frontend/src/app/onboarding/agency/page.tsx` (new) | 12 |
| B-006 | Step 2: Company Information form | Agency name, entity, industry, size, website | Frontend | `frontend/src/components/onboarding/agency/StepCompanyInfo.tsx` (new) | 4 |
| B-007 | Step 3: Branding & Identity form | Logo upload, color pickers, custom domain | Frontend | `frontend/src/components/onboarding/agency/StepBranding.tsx` (new) | 5 |
| B-008 | Step 4: Social Connect | Reuse SocialConnectGrid for agency-level connections | Frontend | `frontend/src/components/onboarding/agency/StepSocialConnect.tsx` (new) | 3 |
| B-009 | Step 5: Invite Team | Email input + role selector + invite link | Frontend | `frontend/src/components/onboarding/agency/StepInviteTeam.tsx` (new) | 5 |
| B-010 | Step 6: Create First Brand | Brand creation inline form | Frontend | `frontend/src/components/onboarding/agency/StepCreateBrand.tsx` (new) | 3 |
| B-011 | Agency Profile page (view/edit) | Full profile view with inline editing, all sections | Frontend | `frontend/src/app/agency/profile/page.tsx` (new) | 10 |
| B-012 | Agency Dashboard redesign | Replace current agency page with rich dashboard (KPIs, brands, team, recent activity) | Frontend | `frontend/src/app/agency/page.tsx` (modify) | 8 |
| B-013 | Agency profile API client | `agencyProfile.ts` - CRUD + upload | Frontend | `frontend/src/lib/api/agencyProfile.ts` (new) | 3 |
| B-014 | File upload for agency (logo, docs, certs) | Presigned URL upload for agency assets | Backend | `backend/app/api/endpoints/uploads.py` (new) | 4 |
| B-015 | Unit tests for agency profile | Model, service, endpoint tests | Backend | `backend/tests/test_agency_profile.py` (new) | 5 |
| B-016 | Frontend tests for agency onboarding | Component + E2E tests for wizard | Frontend | `frontend/src/app/onboarding/agency/__tests__/` (new) | 4 |
| **Subtotal** | | | | | **82 hrs** |

### 5.3 PHASE C: Brand Profile (B)

| Task ID | Task | Description | Backend/Frontend | Files to Create/Modify | Est. Hours |
|---------|------|-------------|-----------------|----------------------|-----------|
| C-001 | Create `BrandProfile` SQLAlchemy model | All fields from Section 3.2 | Backend | `backend/app/models/brand_profile.py` (new) | 3 |
| C-002 | Brand profile Pydantic schemas | Create, Update, Response schemas | Backend | `backend/app/schemas/brand_schemas.py` (new) | 2 |
| C-003 | Brand profile service | CRUD, profile completion, competitor tracking | Backend | `backend/app/services/brand_profile_service.py` (new) | 6 |
| C-004 | Brand profile API endpoints | GET/PUT profile, audience, guidelines, competitors | Backend | `backend/app/api/endpoints/brand_profile.py` (new) | 5 |
| C-005 | Brand onboarding wizard (5 steps) | Full wizard component | Frontend | `frontend/src/app/onboarding/brand/page.tsx` (new) | 10 |
| C-006 | Step 2: Brand Identity form | Name, tagline, logo, cover, colors, industry | Frontend | `frontend/src/components/onboarding/brand/StepBrandIdentity.tsx` (new) | 5 |
| C-007 | Step 3: Target Audience form | Age range sliders, gender, locations, interests | Frontend | `frontend/src/components/onboarding/brand/StepTargetAudience.tsx` (new) | 5 |
| C-008 | Step 4: Social Connect | SocialConnectGrid for brand + handle inputs for non-OAuth | Frontend | `frontend/src/components/onboarding/brand/StepSocialConnect.tsx` (new) | 3 |
| C-009 | Step 5: Brand Guidelines form | Voice selector, values, hashtags, content pillars | Frontend | `frontend/src/components/onboarding/brand/StepGuidelines.tsx` (new) | 5 |
| C-010 | Brand Profile page (view/edit) | Full profile with all sections editable | Frontend | `frontend/src/app/brands/[id]/profile/page.tsx` (new) | 10 |
| C-011 | Brand Dashboard enhancement | Add social metrics, audience insights, content calendar preview | Frontend | `frontend/src/app/brands/[id]/page.tsx` (new) | 8 |
| C-012 | Brand profile API client | `brandProfile.ts` | Frontend | `frontend/src/lib/api/brandProfile.ts` (new) | 3 |
| C-013 | Audience definition component | Reusable audience builder (age, gender, location, interests) | Frontend | `frontend/src/components/brand/AudienceBuilder.tsx` (new) | 5 |
| C-014 | Brand guidelines editor component | Rich editor for dos/donts, hashtags, tone | Frontend | `frontend/src/components/brand/GuidelinesEditor.tsx` (new) | 4 |
| C-015 | Competitor tracker component | Add/manage competitor brands with social handles | Frontend | `frontend/src/components/brand/CompetitorTracker.tsx` (new) | 4 |
| C-016 | Unit tests for brand profile | Model, service, endpoint tests | Backend | `backend/tests/test_brand_profile.py` (new) | 5 |
| C-017 | Frontend tests for brand onboarding | Component + E2E tests | Frontend | `frontend/src/app/onboarding/brand/__tests__/` (new) | 4 |
| **Subtotal** | | | | | **87 hrs** |

### 5.4 PHASE D: Creator Profile (C)

| Task ID | Task | Description | Backend/Frontend | Files to Create/Modify | Est. Hours |
|---------|------|-------------|-----------------|----------------------|-----------|
| D-001 | Create `CreatorProfile` SQLAlchemy model | All fields from Section 3.3 | Backend | `backend/app/models/creator_profile.py` (new) | 3 |
| D-002 | Creator profile Pydantic schemas | Create, Update, Response, PublicProfile schemas | Backend | `backend/app/schemas/creator_schemas.py` (new) | 3 |
| D-003 | Creator profile service | CRUD, metrics aggregation, portfolio management, rate card, availability | Backend | `backend/app/services/creator_profile_service.py` (new) | 8 |
| D-004 | Creator profile API endpoints | GET/PUT profile, portfolio upload, rate card, availability, public profile | Backend | `backend/app/api/endpoints/creator_profile.py` (new) | 6 |
| D-005 | Creator self-registration flow | Separate from brand-added creators: creator signs up, chooses platforms, auto-verifies | Backend | `backend/app/api/endpoints/auth.py` (modify) | 4 |
| D-006 | Creator onboarding wizard (5 steps) | Full wizard component | Frontend | `frontend/src/app/onboarding/creator/page.tsx` (new) | 10 |
| D-007 | Step 2: Personal Info form | Photo, name, display name, location, niche, bio | Frontend | `frontend/src/components/onboarding/creator/StepPersonalInfo.tsx` (new) | 4 |
| D-008 | Step 3: Social Connect (at least 1 required) | SocialConnectGrid with validation - minimum 1 platform | Frontend | `frontend/src/components/onboarding/creator/StepSocialConnect.tsx` (new) | 4 |
| D-009 | Step 4: Portfolio & Media Kit | File upload for media kit, portfolio grid, best work links | Frontend | `frontend/src/components/onboarding/creator/StepPortfolio.tsx` (new) | 6 |
| D-010 | Step 5: Rates & Availability | Rate card per platform/type, min budget, availability toggle, preferred industries | Frontend | `frontend/src/components/onboarding/creator/StepRates.tsx` (new) | 5 |
| D-011 | Creator Profile page (view/edit) | Full self-profile with all sections | Frontend | `frontend/src/app/creator-portal/profile/page.tsx` (new) | 10 |
| D-012 | Creator Public Profile page | Shareable public page with portfolio, metrics, rate card | Frontend | `frontend/src/app/creators/[handle]/page.tsx` (new) | 8 |
| D-013 | Creator Portal Dashboard redesign | Replace mock data with real: earnings, assignments, content calendar, connected platforms | Frontend | `frontend/src/app/creator-portal/page.tsx` (modify) | 10 |
| D-014 | Creator Media Kit generator | Auto-generate PDF media kit from profile data | Backend | `backend/app/services/media_kit_service.py` (new) | 8 |
| D-015 | Media Kit download endpoint | `/api/v1/creators/{id}/media-kit` → PDF | Backend | `backend/app/api/endpoints/creator_profile.py` (modify) | 3 |
| D-016 | Audience metrics aggregation | Pull follower counts/engagement from all connected platforms, aggregate into profile | Backend | `backend/app/services/creator_profile_service.py` (modify) | 5 |
| D-017 | Portfolio upload service | Image/video portfolio upload to S3/R2 | Backend | `backend/app/services/upload_service.py` (new) | 4 |
| D-018 | Creator profile API client | `creatorProfile.ts` | Frontend | `frontend/src/lib/api/creatorProfile.ts` (new) | 3 |
| D-019 | Rate card editor component | Rate per content type per platform | Frontend | `frontend/src/components/creator/RateCardEditor.tsx` (new) | 4 |
| D-020 | Portfolio gallery component | Grid with lightbox for images/videos | Frontend | `frontend/src/components/creator/PortfolioGallery.tsx` (new) | 5 |
| D-021 | Availability status component | Toggle with status badge | Frontend | `frontend/src/components/creator/AvailabilityToggle.tsx` (new) | 2 |
| D-022 | Unit tests for creator profile | Model, service, endpoint tests | Backend | `backend/tests/test_creator_profile.py` (new) | 5 |
| D-023 | Frontend tests for creator onboarding | Component + E2E tests | Frontend | `frontend/src/app/onboarding/creator/__tests__/` (new) | 4 |
| **Subtotal** | | | | | **124 hrs** |

### 5.5 PHASE E: Integration, Polish & Testing

| Task ID | Task | Description | Backend/Frontend | Files to Create/Modify | Est. Hours |
|---------|------|-------------|-----------------|----------------------|-----------|
| E-001 | Account type switcher in settings | Let users see/change profile type (with data migration) | Frontend | `frontend/src/app/settings/page.tsx` (modify) | 3 |
| E-002 | Update sidebar navigation per profile type | Show different nav items based on A/B/C profile | Frontend | `frontend/src/components/layout/Sidebar.tsx` (modify) | 4 |
| E-003 | Profile completion widget (sidebar/dashboard) | Visual progress ring showing % complete | Frontend | `frontend/src/components/shared/ProfileCompletionWidget.tsx` (new) | 3 |
| E-004 | Getting Started checklist | Post-onboarding checklist on dashboard | Frontend | `frontend/src/components/shared/GettingStartedChecklist.tsx` (new) | 4 |
| E-005 | OAuth callback handler page | Frontend page that catches OAuth redirects and sends to API | Frontend | `frontend/src/app/auth/callback/[platform]/page.tsx` (new) | 3 |
| E-006 | Token refresh cron job | Background job to refresh expiring tokens | Backend | `backend/app/jobs/token_refresh.py` (new) | 4 |
| E-007 | Social sync cron job | Pull latest profile metrics from connected accounts | Backend | `backend/app/jobs/social_sync.py` (new) | 5 |
| E-008 | Update RBAC permissions for new endpoints | Add permission entries for agency_profile, brand_profile, creator_profile endpoints | Backend | `backend/app/core/permissions.py` (modify) | 3 |
| E-009 | Update existing frontend API layer | Integrate profile_type into auth, dashboard, settings flows | Frontend | `frontend/src/lib/api/auth.ts`, `dashboard.ts` (modify) | 3 |
| E-010 | Responsive design pass | Ensure all 3 onboarding wizards + profile pages work on mobile | Frontend | Multiple files | 6 |
| E-011 | Error handling & edge cases | Token expiry, OAuth failures, partial profiles, disconnected accounts | Both | Multiple files | 5 |
| E-012 | End-to-end integration tests | Full flow: register → onboard → connect social → view profile | Both | `frontend/tests/e2e/profiles.spec.ts` (new) | 8 |
| E-013 | Backend integration tests | Social OAuth mock tests, profile CRUD, onboarding flow | Backend | `backend/tests/test_integration_profiles.py` (new) | 6 |
| E-014 | Performance testing | Profile page load times, OAuth flow latency | Both | N/A | 3 |
| E-015 | Documentation | API docs, profile field reference, OAuth setup guide | Docs | `docs/profiles.md`, `docs/oauth-setup.md` (new) | 4 |
| **Subtotal** | | | | | **64 hrs** |

---

## 6. Summary

### Total Effort

| Phase | Description | Hours |
|-------|------------|-------|
| **A** | Foundation & Shared Infrastructure | 60 |
| **B** | Agency Profile (A) | 82 |
| **C** | Brand Profile (B) | 87 |
| **D** | Creator Profile (C) | 124 |
| **E** | Integration, Polish & Testing | 64 |
| **TOTAL** | | **417 hours** |

### Timeline (Recommended)

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1-2 | Phase A | Shared infrastructure: DB models, migrations, OAuth service, social connect components |
| 3-4 | Phase B | Agency profile: model, API, onboarding wizard, profile page |
| 5-6 | Phase C | Brand profile: model, API, onboarding wizard, profile page, audience builder |
| 7-9 | Phase D | Creator profile: model, API, onboarding wizard, portal redesign, media kit, public profile |
| 10 | Phase E | Integration, polish, testing, documentation |

### Critical Path

```
A-002 (User profile_type) → A-001 (Register page) → A-016 (Redirect logic)
                                                           │
A-003 (SocialConnection model) → A-007 (OAuth service) → A-008 (API) → A-012 (UI component)
                                                                              │
                    ┌─────────────────────────────────────────────────────────┤
                    │                      │                                   │
              B-005 (Agency Onboard)  C-005 (Brand Onboard)  D-006 (Creator Onboard)
                    │                      │                                   │
              B-011 (Agency Profile)  C-010 (Brand Profile)  D-011 (Creator Profile)
                    │                      │                                   │
                    └──────────────────────┴───────────────────────────────────┘
                                           │
                                     E-012 (E2E Tests)
```

### New Files Summary

| Type | Count | Location |
|------|-------|---------|
| Backend Models | 5 | `backend/app/models/` |
| Backend Schemas | 3 | `backend/app/schemas/` |
| Backend Services | 5 | `backend/app/services/` |
| Backend Endpoints | 5 | `backend/app/api/endpoints/` |
| Backend Utilities | 2 | `backend/app/core/`, `backend/app/utils/` |
| Backend Jobs | 2 | `backend/app/jobs/` |
| Backend Tests | 4 | `backend/tests/` |
| Frontend Pages | 8 | `frontend/src/app/` |
| Frontend Components | 20+ | `frontend/src/components/` |
| Frontend API Layer | 4 | `frontend/src/lib/api/` |
| Frontend Tests | 3+ | Various `__tests__/` directories |
| Migrations | 1 | `backend/alembic/versions/` |
| **Total New Files** | **~62** | |

### Environment Variables Required

```env
# OAuth Credentials (from Phase 18 PROJECT_PLAN.md)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
SNAPCHAT_CLIENT_ID=
SNAPCHAT_CLIENT_SECRET=

# Token Security
SOCIAL_TOKEN_ENCRYPTION_KEY=

# Media Storage (for portfolio/logo uploads)
S3_BUCKET_NAME=caidence-media
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=us-east-1
S3_ENDPOINT_URL=
CDN_BASE_URL=

# OAuth Redirect URIs
OAUTH_REDIRECT_BASE=https://app.caidence.ai/auth/callback
```
