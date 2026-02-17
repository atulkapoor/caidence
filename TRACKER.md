# C(AI)DENCE - Project Issue Tracker

> Single source of truth for all tasks across phases
> Last Updated: February 2026

---

## Dashboard

| Phase | Total | Not Started | In Progress | Completed | Blocked |
|-------|-------|-------------|-------------|-----------|---------|
| RBAC R1-R5 (Core) | 8 | 0 | 0 | 8 | 0 |
| RBAC R6 (Advanced) | 6 | 6 | 0 | 0 | 0 |
| RBAC R7 (Testing) | 4 | 4 | 0 | 0 | 0 |
| ABC Profiles | 12 | 12 | 0 | 0 | 0 |
| Phase 18: Onboarding | 31 | 31 | 0 | 0 | 0 |
| Phase 19: Nano Banner | 10 | 10 | 0 | 0 | 0 |
| Phase 20: Video Studio | 12 | 12 | 0 | 0 | 0 |
| Phase 21: Social Publish | 10 | 10 | 0 | 0 | 0 |
| Phase 22: Lead Hub | 10 | 10 | 0 | 0 | 0 |
| Phase 23: QA | 8 | 8 | 0 | 0 | 0 |
| Phase 24: Performance | 6 | 6 | 0 | 0 | 0 |
| Phase 25: DevOps | 6 | 6 | 0 | 0 | 0 |
| **TOTAL** | **123** | **115** | **0** | **8** | **0** |

### Priority Breakdown

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 28 | Critical — must fix / build first |
| P1 | 42 | High — core functionality |
| P2 | 35 | Medium — important but not blocking |
| P3 | 18 | Low — nice to have |

### Effort Legend

| Code | Hours | Description |
|------|-------|-------------|
| S | < 4h | Quick task |
| M | 4-16h | Standard task |
| L | 16-40h | Multi-day task |
| XL | > 40h | Major feature block |

---

## RBAC Engine — R1-R5 (Core) [COMPLETED]

| ID | Title | Status | Priority | Effort |
|----|-------|--------|----------|--------|
| R1-001 | Move SECRET_KEY to env config | Completed | P0 | S |
| R1-002 | Remove mock user from deps.py | Completed | P0 | S |
| R1-003 | Add hierarchy validation to role assignment | Completed | P0 | M |
| R2-001 | Create PermissionEngine service | Completed | P0 | L |
| R2-002 | Create tenant filtering middleware | Completed | P0 | M |
| R3-001 | Build RBAC API endpoints (roles, permissions, audit) | Completed | P0 | L |
| R4-001 | Add AuditLog and AccessLog models | Completed | P1 | M |
| R5-001 | Frontend RBAC redesign (PermissionGate, PermissionContext, page wrapping) | Completed | P0 | XL |

---

## RBAC Engine — R6 (Advanced Features)

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| R6-001 | Permission caching with Redis (per-request TTL) | Not Started | P2 | M | Redis in docker-compose |
| R6-002 | API rate limiting by role tier (slowapi integration) | Not Started | P2 | M | — |
| R6-003 | Email invitation workflow (token, expiry, accept link) | Not Started | P1 | L | Email service exists |
| R6-004 | Profile-type role constraints (A/B/C limits assignable roles) | Not Started | P1 | M | ABC Profiles |
| R6-005 | Resource-level (row-level) permissions using scope_type/scope_id | Not Started | P2 | L | — |
| R6-006 | Brand-level data isolation enforcement | Not Started | P1 | L | — |

---

## RBAC Engine — R7 (Testing & Documentation)

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| R7-001 | Backend unit tests for PermissionEngine | Not Started | P1 | M | — |
| R7-002 | Backend integration tests for RBAC endpoints | Not Started | P1 | M | — |
| R7-003 | Frontend unit tests for PermissionGate/usePermission | Not Started | P1 | M | — |
| R7-004 | E2E tests for role assignment and access denial flows | Not Started | P2 | M | — |

---

## ABC Profiles

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| ABC-001 | AgencyProfile model + Alembic migration | Not Started | P0 | M | — |
| ABC-002 | BrandProfile model + Alembic migration | Not Started | P0 | M | — |
| ABC-003 | CreatorProfile model + Alembic migration | Not Started | P0 | M | — |
| ABC-004 | Add profile_type field to User model | Not Started | P0 | S | — |
| ABC-005 | Agency profile API endpoints (GET/PUT /api/v1/agency/profile) | Not Started | P1 | M | ABC-001 |
| ABC-006 | Brand profile API endpoints (GET/PUT /api/v1/brands/:id/profile) | Not Started | P1 | M | ABC-002 |
| ABC-007 | Creator profile API endpoints (GET/PUT /api/v1/creators/:id/profile) | Not Started | P1 | M | ABC-003 |
| ABC-008 | Agency profile frontend page (enrich agency/page.tsx) | Not Started | P1 | L | ABC-005 |
| ABC-009 | Brand profile frontend page (enrich brand detail view) | Not Started | P1 | L | ABC-006 |
| ABC-010 | Creator portal frontend enrichment (media kit, rate card) | Not Started | P1 | L | ABC-007 |
| ABC-011 | Profile type selector during onboarding | Not Started | P0 | M | P18-017 |
| ABC-012 | Profile completion percentage tracking | Not Started | P2 | M | ABC-005, ABC-006, ABC-007 |

---

## Phase 18: User Onboarding & Social Account Connection

### Backend — Models & Config

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P18-001 | SocialConnection model (backend/app/models/social.py) | Not Started | P0 | S | — |
| P18-002 | OnboardingProgress model | Not Started | P0 | S | — |
| P18-003 | Alembic migration for social_connections + onboarding_progress tables | Not Started | P0 | S | P18-001, P18-002 |
| P18-004 | OAuth provider env vars in config.py (12 credentials + URLs) | Not Started | P0 | S | — |

### Backend — Services

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P18-005 | SocialAuthService — OAuth2 authorization URL builder | Not Started | P0 | M | P18-001 |
| P18-006 | SocialAuthService — OAuth2 callback handler (token exchange + store) | Not Started | P0 | L | P18-005 |
| P18-007 | SocialAuthService — token refresh + revocation | Not Started | P1 | M | P18-006 |
| P18-008 | OnboardingService — step tracking CRUD | Not Started | P0 | M | P18-002 |
| P18-009 | OnboardingService — profile-type-aware step definitions (A/B/C) | Not Started | P0 | M | P18-008 |
| P18-010 | OnboardingService — creator min-1-social validation | Not Started | P1 | S | P18-009, P18-001 |

### Backend — API Endpoints

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P18-011 | POST /api/v1/social/connect/{platform} — initiate OAuth | Not Started | P0 | M | P18-005 |
| P18-012 | GET /api/v1/social/callback/{platform} — OAuth callback | Not Started | P0 | M | P18-006 |
| P18-013 | GET /api/v1/social/connections — list user connections | Not Started | P0 | S | P18-001 |
| P18-014 | DELETE /api/v1/social/disconnect/{platform} — revoke | Not Started | P1 | S | P18-007 |
| P18-015 | GET /api/v1/onboarding/progress — get current step | Not Started | P0 | S | P18-008 |
| P18-016 | PUT /api/v1/onboarding/progress — update step data | Not Started | P0 | S | P18-008 |
| P18-017 | POST /api/v1/onboarding/complete — mark complete | Not Started | P0 | S | P18-009 |
| P18-018 | Register social + onboarding routers in api.py | Not Started | P0 | S | P18-011, P18-015 |

### Frontend — API Layer

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P18-019 | Create frontend/src/lib/api/social.ts (API client) | Not Started | P0 | S | — |
| P18-020 | Create frontend/src/lib/api/onboarding.ts (API client) | Not Started | P0 | S | — |

### Frontend — Onboarding UI

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P18-021 | Onboarding route + layout (/onboarding, minimal chrome) | Not Started | P0 | M | P18-020 |
| P18-022 | OnboardingWizard shell (progress bar, step nav, prev/next/skip) | Not Started | P0 | L | P18-021 |
| P18-023 | ProfileTypeStep — Agency/Brand/Creator card selection | Not Started | P0 | M | P18-022 |
| P18-024 | ConnectSocialsStep — shared step with SocialConnectCard grid | Not Started | P0 | L | P18-019, P18-022 |
| P18-025 | Agency steps: CompanyInfo, Branding, InviteTeam, CreateBrand | Not Started | P1 | L | P18-022 |
| P18-026 | Brand steps: BrandIdentity, TargetAudience, BrandGuidelines | Not Started | P1 | L | P18-022 |
| P18-027 | Creator steps: PersonalInfo, Portfolio, RateCard | Not Started | P1 | L | P18-022 |

### Frontend — Wiring & Polish

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P18-028 | Redirect register/page.tsx from /dashboard to /onboarding | Not Started | P0 | S | P18-021 |
| P18-029 | Dashboard "Complete your setup" banner for incomplete onboarding | Not Started | P1 | M | P18-015 |
| P18-030 | Replace SocialAccountsSettings.tsx fake state with real API | Not Started | P1 | M | P18-013, P18-014 |
| P18-031 | Fix ProtectedRoute.tsx mock user — wire to real auth | Not Started | P1 | M | — |

---

## Phase 19: Image Studio — Nano Banner Engine

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P19-001 | BannerTemplate + BannerProject models | Not Started | P1 | M | — |
| P19-002 | Template library (12 platform-specific banner sizes) | Not Started | P1 | L | P19-001 |
| P19-003 | AI banner generation service (text prompt → image) | Not Started | P0 | XL | Ollama integration |
| P19-004 | Canvas layer editor component (drag/drop, resize, text overlay) | Not Started | P1 | XL | — |
| P19-005 | Brand kit integration (auto-apply logo, colors, fonts) | Not Started | P2 | L | ABC-002 |
| P19-006 | Smart resize — generate all platform sizes from one design | Not Started | P2 | L | P19-004 |
| P19-007 | Banner export (PNG, JPG, PDF, SVG) | Not Started | P1 | M | P19-004 |
| P19-008 | Banner history + versioning | Not Started | P2 | M | P19-001 |
| P19-009 | Backend API endpoints for banner CRUD | Not Started | P1 | M | P19-001 |
| P19-010 | Frontend /image-studio route and pages | Not Started | P1 | L | P19-004, P19-009 |

---

## Phase 20: Video & Reels Studio

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P20-001 | VideoAsset + ReelsProject + MusicTrack models | Not Started | P1 | M | — |
| P20-002 | Video upload + S3/R2 storage service | Not Started | P0 | L | S3/R2 setup |
| P20-003 | FFmpeg transcoding service (background job) | Not Started | P0 | XL | Celery/ARQ |
| P20-004 | Video library management UI | Not Started | P1 | L | P20-002 |
| P20-005 | Reels timeline editor (clips, text overlays, transitions) | Not Started | P1 | XL | — |
| P20-006 | Music library + audio track management | Not Started | P2 | L | P20-001 |
| P20-007 | Auto-captions via AI speech-to-text | Not Started | P2 | L | P20-003 |
| P20-008 | Multi-platform video publishing | Not Started | P1 | L | Phase 21 |
| P20-009 | Backend API for video CRUD + processing status | Not Started | P1 | M | P20-001 |
| P20-010 | Frontend /video-studio route and pages | Not Started | P1 | L | P20-004, P20-005 |
| P20-011 | HLS streaming for video preview | Not Started | P2 | M | P20-003 |
| P20-012 | VideoPublication model for publish tracking | Not Started | P2 | S | P20-001 |

---

## Phase 21: Social Platform Connections (Publishing)

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P21-001 | SocialPost + SocialPostPlatform models | Not Started | P0 | M | — |
| P21-002 | ContentCalendarEntry model | Not Started | P1 | S | — |
| P21-003 | Instagram publishing service (Graph API posts/stories/reels) | Not Started | P0 | L | P18-006 |
| P21-004 | Facebook publishing service (page posts, stories) | Not Started | P0 | L | P18-006 |
| P21-005 | YouTube upload service (videos, shorts) | Not Started | P1 | L | P18-006 |
| P21-006 | LinkedIn publishing service (posts, articles) | Not Started | P1 | L | P18-006 |
| P21-007 | Unified social dashboard UI | Not Started | P1 | L | P21-001 |
| P21-008 | Content calendar UI (replace mock SocialCalendar) | Not Started | P1 | L | P21-002 |
| P21-009 | Post scheduling service (background job queue) | Not Started | P0 | M | P21-001, Redis |
| P21-010 | Social analytics aggregation (per-platform metrics) | Not Started | P2 | L | P21-003, P21-004 |

---

## Phase 22: Lead Integrations Hub

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P22-001 | LeadSource + Lead + LeadActivity models | Not Started | P0 | M | — |
| P22-002 | Inbound webhook receiver service | Not Started | P0 | L | — |
| P22-003 | Facebook Lead Ads integration (webhook + Graph API) | Not Started | P0 | L | P22-002 |
| P22-004 | Google Ads lead form integration (webhook) | Not Started | P1 | L | P22-002 |
| P22-005 | LinkedIn Lead Gen Forms integration (webhook) | Not Started | P1 | L | P22-002 |
| P22-006 | Lead normalization + deduplication service | Not Started | P1 | M | P22-001 |
| P22-007 | AI lead scoring service | Not Started | P2 | L | P22-006 |
| P22-008 | CSV import/export for leads | Not Started | P2 | M | P22-001 |
| P22-009 | Lead management UI (list, filter, score, assign) | Not Started | P1 | L | P22-001 |
| P22-010 | Zapier integration (outbound webhooks) | Not Started | P3 | M | P22-001 |

---

## Phase 23: Testing & Quality Assurance

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P23-001 | Backend unit tests for SocialAuthService | Not Started | P1 | M | P18-006 |
| P23-002 | Backend unit tests for OnboardingService | Not Started | P1 | M | P18-009 |
| P23-003 | Backend integration tests for social/onboarding endpoints | Not Started | P1 | M | P18-018 |
| P23-004 | Frontend unit tests for onboarding wizard components | Not Started | P1 | M | P18-022 |
| P23-005 | E2E test: register → onboarding → dashboard flow | Not Started | P2 | M | P18-028 |
| P23-006 | E2E test: social connect/disconnect flow | Not Started | P2 | M | P18-024 |
| P23-007 | Backend tests for banner/video services | Not Started | P2 | L | P19, P20 |
| P23-008 | E2E tests for social publishing flow | Not Started | P2 | L | P21 |

---

## Phase 24: Performance & Optimization

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P24-001 | Video transcoding queue (Celery/ARQ workers) | Not Started | P1 | L | P20-003 |
| P24-002 | CDN setup for media delivery (CloudFront/CloudFlare) | Not Started | P1 | M | S3/R2 |
| P24-003 | Redis caching for social analytics data | Not Started | P2 | M | P21-010 |
| P24-004 | S3 presigned URLs for direct upload | Not Started | P2 | M | P20-002 |
| P24-005 | Database indexing audit + optimization | Not Started | P2 | M | — |
| P24-006 | WebSocket integration for real-time processing status | Not Started | P3 | L | P20-003 |

---

## Phase 25: Deployment & DevOps

| ID | Title | Status | Priority | Effort | Dependencies |
|----|-------|--------|----------|--------|--------------|
| P25-001 | Docker Compose production config (multi-stage builds) | Not Started | P0 | M | — |
| P25-002 | Environment variable documentation + secrets management | Not Started | P0 | M | — |
| P25-003 | Alembic migration strategy for production deploys | Not Started | P1 | M | — |
| P25-004 | HTTPS / reverse proxy setup (Traefik or Nginx) | Not Started | P1 | M | — |
| P25-005 | Automated backup strategy for PostgreSQL | Not Started | P1 | M | — |
| P25-006 | Monitoring + alerting (health checks, error tracking) | Not Started | P2 | L | — |

---

## Notes

### Implementation Priority Order
1. **Phase 18** (Onboarding + Social OAuth) — P0, prerequisite for everything
2. **ABC Profiles** — P0, enriches onboarding with profile-type-specific data
3. **RBAC R6-R7** — P1, hardening and testing
4. **Phase 19** (Nano Banner) — P1, new revenue feature
5. **Phase 21** (Social Publishing) — P1, depends on Phase 18 OAuth
6. **Phase 20** (Video Studio) — P1, infrastructure-heavy
7. **Phase 22** (Lead Hub) — P1, ad platform integrations
8. **Phase 23-25** (QA, Performance, DevOps) — P1-P2, cross-cutting

### Key Dependencies
- Phase 21 (Social Publishing) requires Phase 18 (OAuth tokens)
- Phase 20 (Video) requires S3/R2 storage + FFmpeg + Celery
- ABC Profiles and Phase 18 share onboarding flow components
- Phase 22 (Leads) requires webhook infrastructure
- Phase 24 (Performance) depends on Phases 19-22 being built
