# C(AI)DENCE API Reference

**Base URL:** `/api/v1`

**Authentication:** JWT Bearer token obtained from `POST /api/v1/auth/login`. Pass via `Authorization: Bearer <token>` header.

**Interactive Docs:** Available at `/api/v1/openapi.json` (Swagger UI at `/docs`, ReDoc at `/redoc`).

---

## Authentication and Authorization

### Dependency Chain

All protected endpoints use the following dependency chain defined in `backend/app/api/deps.py`:

| Dependency | Description |
|---|---|
| `get_current_user` | Decodes JWT, loads user from DB. In development only: falls back to a mock `super_admin` when no token is provided. In production, always requires a valid token. |
| `get_current_active_user` | Wraps `get_current_user`; raises 400 if `is_active=False`, raises 403 if `is_approved=False`. |
| `require_permission(action, resource)` | Wraps `get_current_active_user`; evaluates the RBAC `PermissionEngine` against the user's role and any per-user overrides. Raises 403 on denial. |
| `require_role(*roles)` | Wraps `get_current_active_user`; enforces an explicit role allowlist. |
| `require_super_admin` | Shortcut: raises 403 unless `role` is `root` or `super_admin`. |
| `require_admin` | Shortcut for `root`, `super_admin`, `agency_admin`. |

### Role Hierarchy

Roles in descending privilege order: `root` > `super_admin` > `agency_admin` > `agency_member` > `brand_admin` > `brand_member` > `creator` > `viewer`.

### RBAC Permission Keys

The `require_permission` dependency uses `resource:action` pairs. Valid actions are `read` and `write`.

| Permission Key | Convenience Dependency |
|---|---|
| `campaign:read` | `require_campaign_read` |
| `campaign:write` | `require_campaign_write` |
| `content:read` | `require_content_read` |
| `content:write` | `require_content_write` |
| `design_studio:read` | `require_design_read` |
| `design_studio:write` | `require_design_write` |
| `discovery:read` | `require_discovery_read` |
| `analytics:read` | `require_analytics_read` |
| `crm:read` | `require_crm_read` |
| `crm:write` | `require_crm_write` |
| `marcom:read` | `require_marcom_read` |
| `marcom:write` | `require_marcom_write` |
| `workflow:read` | `require_workflow_read` |
| `workflow:write` | `require_workflow_write` |
| `creators:read` | `require_creators_read` |
| `creators:write` | `require_creators_write` |

---

## 1. Authentication

**Prefix:** `/api/v1/auth`

No token required for `register`, `login`, and `recover-password`. All other endpoints require authentication.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new user. Account is created with `is_approved=False` and requires super admin approval before login is possible. Body: `{ email, password, full_name, role? }`. |
| `POST` | `/login` | Public | Authenticate with form data (`username` + `password` fields, OAuth2 password flow). Returns `{ access_token, token_type }`. Raises 403 if account is not yet approved. |
| `GET` | `/me` | `get_current_active_user` | Returns the currently authenticated user's profile (`id`, `email`, `full_name`, `role`, `organization_id`, `is_active`, `is_approved`). |
| `POST` | `/set-password` | `require_super_admin` | Set the password for any user by email. Query params: `email`, `password`. |
| `POST` | `/recover-password` | Public | Initiate password recovery. Sends a reset email if the address is registered. Always returns a success message to prevent email enumeration. Query param: `email`. |

---

## 2. Dashboard

**Prefix:** `/api/v1/dashboard`

No explicit auth dependency on most endpoints (relies on the development mock user fallback; intended to be secured in production).

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/stats` | None (dev fallback) | Aggregated dashboard data: active campaign count, AI workflow count, content generated, AI conversations, performance timeline, and featured campaign. Query param: `range` (default `6m`; options: `7d`, `30d`, `3m`, `6m`). |
| `GET` | `/activities` | None (dev fallback) | Recent activity log entries. Query params: `skip` (default 0), `limit` (default 5). |
| `GET` | `/campaigns` | None (dev fallback) | List of campaigns for dashboard overview. Query params: `skip`, `limit` (default 10). |

---

## 3. Projects

**Prefix:** `/api/v1/projects`

No RBAC dependency; uses no auth in current implementation (intended for early-phase use).

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | None | Create a new project. Body: `ProjectCreate` schema. |
| `GET` | `/` | None | List all projects. Query params: `skip`, `limit` (default 100). |

---

## 4. Chat

**Prefix:** `/api/v1/chat`

No explicit auth; uses a hardcoded `user_id=1`. Sessions are per UUID.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/history/{session_id}` | None | Retrieve all messages in a chat session, ordered by timestamp. |
| `GET` | `/sessions` | None | List all unique session IDs for the default user. |
| `POST` | `/message` | None | Send a message to the AI assistant. Creates a new session if `session_id` is not provided. Body: `{ message, session_id? }`. Returns `{ response, session_id }`. |

---

## 5. Content

**Prefix:** `/api/v1/content`

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `/` | `require_content_read` | `content:read` | List AI-generated content items. Super admins see all; other roles see only their organization's content. Query params: `skip`, `limit`. |
| `GET` | `/{content_id}` | `require_content_read` | `content:read` | Get a single content generation record. |
| `POST` | `/generate` | `require_content_write` | `content:write` | Generate AI content. Body: `{ title, platform, content_type, prompt }`. Calls the AI service and persists the result. |
| `DELETE` | `/{content_id}` | `require_content_write` | `content:write` | Delete a content generation record (organization-scoped). |

---

## 6. Design Studio

**Prefix:** `/api/v1/design`

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `` (empty) | `require_design_read` | `design_studio:read` | List design assets. Organization-scoped for non-admins. Query params: `skip`, `limit`. |
| `GET` | `/{asset_id}` | `require_design_read` | `design_studio:read` | Get a single design asset. Returns a proxied `image_url` pointing to the image endpoint. |
| `GET` | `/{asset_id}/image` | `require_design_read` | `design_studio:read` | Stream the raw image bytes for a design asset (PNG). Decodes stored base64 data. |
| `POST` | `/generate` | `require_design_write` | `design_studio:write` | Generate an AI image. Body: `{ title, style, prompt, aspect_ratio, brand_colors?, reference_image? }`. |
| `PUT` | `/{asset_id}` | `require_design_write` | `design_studio:write` | Update a design asset's metadata. |
| `DELETE` | `/{asset_id}` | `require_design_write` | `design_studio:write` | Delete a design asset. |

---

## 7. Workflows

**Prefix:** `/api/v1/workflow`

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `` | `require_workflow_read` | `workflow:read` | List workflows. Organization-scoped for non-admins. Query params: `skip`, `limit`. |
| `POST` | `` | `require_workflow_write` | `workflow:write` | Create a new workflow. Body: `{ name, description, steps_json }`. |
| `GET` | `/{workflow_id}` | `require_workflow_read` | `workflow:read` | Get a single workflow. |
| `PATCH` | `/{workflow_id}` | `require_workflow_write` | `workflow:write` | Update a workflow's name, description, and steps. |
| `GET` | `/{workflow_id}/history` | `require_workflow_read` | `workflow:read` | List all run history for a workflow, ordered by most recent. |
| `POST` | `/{workflow_id}/run` | `require_workflow_write` | `workflow:write` | Execute a workflow. Creates a `WorkflowRun` record and increments `run_count`. |

---

## 8. Presentations

**Prefix:** `/api/v1/presentation`

No RBAC dependency; uses hardcoded `user_id=1`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/generate` | None | Generate a presentation using AI. Body: `{ title, source_type }`. Persists the result and returns the presentation object. |
| `GET` | `/` | None | List all presentations, newest first. Query params: `skip`, `limit`. |
| `GET` | `/{presentation_id}` | None | Get a single presentation by ID. |

---

## 9. Campaigns

**Prefix:** `/api/v1/campaigns`

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `/` | `require_campaign_read` | `campaign:read` | List campaigns. Super admins see all; others see only their organization's. Query params: `skip`, `limit`. |
| `POST` | `/` | `require_campaign_write` | `campaign:write` | Create a new campaign. Body: `CampaignCreate` schema. |
| `GET` | `/{campaign_id}` | `require_campaign_read` | `campaign:read` | Get campaign with full detail including influencers and events. |
| `PUT` | `/{campaign_id}` | `require_campaign_write` | `campaign:write` | Update an existing campaign. |
| `DELETE` | `/{campaign_id}` | `require_campaign_write` | `campaign:write` | Delete a campaign. |
| `POST` | `/{campaign_id}/launch` | `require_campaign_write` | `campaign:write` | Set campaign status to `active` and log a `launch` event. |
| `POST` | `/{campaign_id}/influencers` | `require_campaign_write` | `campaign:write` | Add an influencer to a campaign by handle. Creates the `Influencer` record if it does not exist. Query param: `influencer_handle`. |
| `GET` | `/analytics/stats` | `require_campaign_read` | `campaign:read` | Aggregated campaign analytics overview (spend, ROI, conversions, CTR, performance chart, channel distribution). |

---

## 10. AI Agent

**Prefix:** `/api/v1/agent`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/enhance_description` | None | Rewrite a campaign description to be more engaging using the AI service. Body: `{ text }`. Returns `{ enhanced_text }`. |
| `POST` | `/draft_campaign` | None | Generate a two-plan (Plan A + Plan B) campaign draft using AI. Simulates a multi-agent researcher/strategist/creative flow. Body: `{ goal, product, audience }`. |
| `POST` | `/generate` | `get_current_active_user` | Generate a full marketing strategy and save it as a new Project. Body: `{ role, project_type, objective, assets? }`. Returns `{ project_id, strategy }`. |

---

## 11. Communications

**Prefix:** `/api/v1/communications`

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `/status` | `require_marcom_read` | `marcom:read` | Get the connection status of all CPaaS channels (email, SMS, WhatsApp). |
| `POST` | `/send/email` | `require_marcom_write` | `marcom:write` | Send an email via the CPaaS service. Body: `{ to_email, subject, body }`. |
| `POST` | `/send/sms` | `require_marcom_write` | `marcom:write` | Send an SMS. Body: `{ phone_number, message }`. |
| `POST` | `/send/whatsapp` | `require_marcom_write` | `marcom:write` | Send a WhatsApp message. Body: `{ phone_number, content }`. |

---

## 12. Analytics

**Prefix:** `/api/v1/analytics`

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `/dashboard` | `require_analytics_read` | `analytics:read` | Aggregated analytics: total reach, engagement rate, conversions, ROI, 12-month event timeline, and audience device breakdown. Uses real `CampaignEvent` data; falls back to demo values on empty databases. |
| `POST` | `/audience-overlap` | `require_analytics_read` | `analytics:read` | Simulate audience overlap calculation across multiple channels. Body: `{ channels: string[] }`. Returns total reach, unique reach, overlap percentage, and per-channel breakdown. |
| `POST` | `/influencer-credibility` | `require_analytics_read` | `analytics:read` | Score an influencer for bot/fake-follower risk. Body: `{ handle, platform }`. Returns credibility score (0-100), fake follower percentage, verification status, and risk level. |
| `POST` | `/competitor-analysis` | `require_analytics_read` | `analytics:read` | Simulate share-of-voice and sentiment analysis for a list of competitors. Body: `{ competitors: string[] }`. |

---

## 13. Discovery (Creator Discovery)

**Prefix:** `/api/v1/discovery`

Requires `INFLUENCERS_CLUB_API_KEY` environment variable. All endpoints consume credits from the user's `CreditAccount`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/search` | `require_discovery_read` | Search for creators via the Influencers Club API. Accepts query params (`platform`, `ai_search`, `min_followers`, `max_followers`, `min_engagement`, `location`, `has_brand_deals`, `is_verified`, `limit`, `page`) and/or a JSON body `{ query, filters }`. Deducts 0.01 credits per result returned. |
| `POST` | `/similar` | `require_discovery_read` | Find lookalike creators based on a reference handle. Query params: `platform`, `handle`, `min_followers?`, `max_followers?`, `limit`, `page`. |
| `POST` | `/enrich` | `require_discovery_read` | Enrich a creator profile. Query params: `platform`, `handle`, `mode` (`raw` = 0.03 credits; `full` = 1 credit). Full mode adds email, growth trends, posting frequency, and platform connections. |
| `POST` | `/post-details` | `require_discovery_read` | Get post engagement metrics. Query params: `platform`, `post_id`, `content_type` (`data`, `comments`, `transcript`, `audio`). Costs 0.03 credits. |
| `GET` | `/classifiers/languages` | `require_discovery_read` | List all language classifier options available for filtering. |
| `GET` | `/classifiers/locations/{platform}` | `require_discovery_read` | List available location (country/city) options for a platform. |
| `GET` | `/classifiers/yt-topics` | `require_discovery_read` | List available YouTube topic classifiers. |
| `GET` | `/classifiers/twitch-games` | `require_discovery_read` | List available Twitch game classifiers. |
| `GET` | `/smoke` | `require_discovery_read` | Smoke test for the Influencers Club integration (validates API key and connectivity). |
| `GET` | `/credits` | `require_discovery_read` | Get current credit balance, monthly limit, percent used, usage stats, and last 20 transactions. Query param: `days` (default 30). |
| `POST` | `/credits/initialize` | `require_discovery_read` | Initialize a credit account for the current user. Query param: `initial_balance` (default 1000.0). |

---

## 14. CRM

**Prefix:** `/api/v1/crm`

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `/relationships` | `require_crm_read` | `crm:read` | List influencer/creator relationship profiles with campaign history and spend data. Returns data from the `Creator` and `Influencer` tables; falls back to demo data on empty databases. |
| `POST` | `/generate-report` | `require_crm_write` | `crm:write` | Generate an X-Ray PDF report for an influencer. Query param: `handle`. Returns a download URL stub. |

---

## 15. Organizations

**Prefix:** `/api/v1/organizations`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | `get_current_active_user` | List organizations. Super admins see all; other users see only their own organization. |
| `POST` | `/` | `get_current_active_user` | Create a new organization. Super admins only. Body: `{ name, slug, logo_url?, plan_tier? }`. |
| `GET` | `/{org_id}` | `get_current_active_user` | Get organization details. Non-super-admins can only retrieve their own organization. |
| `PATCH` | `/{org_id}` | `get_current_active_user` | Update organization settings. Only super admins and agency admins of the target organization may update. Only super admins may change `plan_tier` or `is_active`. |
| `GET` | `/{org_id}/usage` | `get_current_active_user` | Get usage statistics for an organization (brands, users, campaigns, storage). |
| `GET` | `/{org_id}/users` | `get_current_active_user` | List users belonging to the organization. |

---

## 16. Brands

**Prefix:** `/api/v1/brands`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `` | `get_current_active_user` | List brands. Super admins see all; others see only their organization's brands. |
| `POST` | `` | `get_current_active_user` | Create a brand. Requires agency-level role. Body: `{ name, organization_id?, slug?, logo_url?, industry?, description? }`. |
| `GET` | `/{brand_id}` | `get_current_active_user` | Get brand details. Non-super-admins must belong to the brand's organization. |
| `PATCH` | `/{brand_id}` | `get_current_active_user` | Update a brand. Allowed for super admins, agency admins, and brand admins within the same organization. |
| `DELETE` | `/{brand_id}` | `get_current_active_user` | Soft-delete (deactivate) a brand. Only agency admins and super admins. |

---

## 17. Creators

**Prefix:** `/api/v1/creators`

| Method | Path | Auth | Permission |
|---|---|---|---|
| `GET` | `/` | `require_creators_read` | `creators:read` | List creators. Organization-scoped for non-admins. Query params: `brand_id?`, `status?`. |
| `POST` | `/` | `require_creators_write` | `creators:write` | Add a creator to the roster. Body: `{ handle, platform, brand_id?, name?, email?, phone?, bio?, category?, tier?, follower_count?, engagement_rate? }`. |
| `GET` | `/{creator_id}` | `require_creators_read` | `creators:read` | Get creator details. |
| `PATCH` | `/{creator_id}` | `require_creators_write` | `creators:write` | Update creator profile, status, commission rate, or notes. |
| `DELETE` | `/{creator_id}` | `require_creators_write` | `creators:write` | Soft-remove creator (sets status to `past`). |
| `POST` | `/{creator_id}/affiliate` | `require_creators_write` | `creators:write` | Generate or retrieve a unique affiliate code and URL for a creator. |
| `GET` | `/{creator_id}/performance` | `require_creators_read` | `creators:read` | Get performance metrics for a creator (clicks, conversions, conversion rate, revenue, commission earned). |

---

## 18. Admin

**Prefix:** `/api/v1/admin`

All endpoints require `require_super_admin` (roles: `root` or `super_admin`).

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/overview` | `require_super_admin` | Platform overview: total organizations, users, brands, pending approvals, MRR, and active subscriptions. |
| `GET` | `/users` | `require_super_admin` | List all users with their custom permission overrides. Query params: `role?`, `is_approved?`. |
| `PATCH` | `/users/{user_id}` | `require_super_admin` | Update user role, active status, approval status, or organization assignment. Body: `{ role?, is_active?, is_approved?, organization_id? }`. |
| `POST` | `/users/{user_id}/permissions` | `require_super_admin` | Create or update a per-user permission override. Body: `{ module, access_level }`. |
| `DELETE` | `/users/{user_id}/permissions/{resource}` | `require_super_admin` | Remove a specific permission override from a user. |
| `POST` | `/invite` | `require_super_admin` | Invite a new team member by creating their account directly (auto-approved). Body: `{ email, full_name, role, organization_id?, password }`. Attempts to send an invite email; user creation succeeds regardless. |
| `GET` | `/billing` | `require_super_admin` | Billing overview: MRR, ARR, total customers, free/pro/enterprise tier counts, churn rate. |
| `GET` | `/subscriptions` | `require_super_admin` | List all organization subscriptions with plan tier and monthly amount. |
| `PATCH` | `/organizations/{org_id}/plan` | `require_super_admin` | Update an organization's plan tier. Query param: `plan_tier` (one of `free`, `pro`, `enterprise`). |
| `GET` | `/usage` | `require_super_admin` | Platform usage analytics: daily active users (last 7 days), API calls today, storage used, bandwidth used. |

---

## 19. Marcom (Marketing Communications)

**Prefix:** `/api/v1/marcom`

| Method | Path | Auth | Permission |
|---|---|---|---|
| `POST` | `/generate` | `get_current_active_user` | Generate AI-powered marketing communications content using a named tool. Body: `{ tool_id, inputs: { key: value } }`. Returns `{ content, tool_id }`. |

---

## 20. Jobs (Background Jobs)

**Prefix:** `/api/v1/jobs`

No auth dependency in current implementation. Jobs are dispatched to Redis (via `job_queue`); if Redis is unavailable, tasks execute synchronously.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/enqueue` | None | Enqueue a named background task. Body: `{ task_name, args?, kwargs? }`. Available tasks: `generate_content`, `generate_design`, `generate_presentation`, `send_campaign_emails`, `execute_workflow`. |
| `GET` | `/status/{job_id}` | None | Check the status of a background job. Returns `{ job_id, status, result?, error?, created_at? }`. |
| `GET` | `/health` | None | Get the health status of the Redis job queue. |
| `POST` | `/generate-content` | None | Convenience shortcut to enqueue a content generation job. Body: `{ title, platform, content_type, prompt }`. |
| `POST` | `/generate-design` | None | Convenience shortcut to enqueue a design generation job. Body: `{ title, style, prompt }`. |

---

## 21. Profile

**Prefix:** `/api/v1/profile`

Uses a hardcoded `user_id=1`; creates a default user record if none exists.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | None | Get the current user's profile. Creates a default profile if it does not exist. |
| `PUT` | `/` | None | Update the current user's profile. Body: `ProfileUpdate` schema (partial updates supported). |

---

## 22. Teams

**Prefix:** `/api/v1/teams`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | `get_current_active_user` | List teams. `root` users see all teams. Agency-level users see their organization's teams. Regular members see only their own team. |
| `POST` | `/` | `get_current_active_user` | Create a new team. Requires `root` or agency-level role. Agency admins cannot create teams for other organizations. Body: `TeamCreate` schema. |
| `GET` | `/{team_id}` | `get_current_active_user` | Get a team by ID. Access restricted to users in the same organization or `root`. |

---

## 23. RBAC (Role-Based Access Control Engine)

**Prefix:** `/api/v1/rbac`

Most write operations require `super_admin` or `root`. The permission check endpoint is available to any authenticated user.

### Roles

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/roles` | `get_current_active_user` | List all roles ordered by hierarchy level (highest first). |
| `POST` | `/roles` | Super admin | Create a custom role. Cannot create roles at or above your own hierarchy level. Body: `RoleCreate` schema. Returns 201 on success, 409 if name already exists. |
| `PUT` | `/roles/{role_id}` | Super admin | Update a role. Cannot modify built-in `root`/`super_admin` roles unless you are `root`. |
| `DELETE` | `/roles/{role_id}` | Super admin | Delete a custom role. Built-in roles and roles with active user assignments cannot be deleted. |
| `PUT` | `/roles/{role_id}/permissions` | Super admin | Replace the `permissions_json` for a role. Body: `{ permissions_json: { resource: [actions] } }`. Valid actions are `read` and `write`. |

### Role Assignment

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/assign` | `get_current_active_user` | Assign a role to a user. Non-root users may only assign roles below their own hierarchy level and cannot manage users outside their organization. Body: `{ user_id, role_name, scope_type?, scope_id? }`. |

### Permission Overrides

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/permissions/me` | `get_current_active_user` | Get the current user's effective permissions (role-based + overrides merged). |
| `GET` | `/users/{user_id}/permissions` | Super admin | Get effective permissions for any user. |
| `GET` | `/overrides/{user_id}` | Self or super admin | List per-user permission overrides. |
| `POST` | `/overrides` | Super admin | Create a permission override for a user. Returns 409 if one already exists for the same resource/scope. Body: `{ user_id, resource, action, scope_type, scope_id?, is_allowed }`. |
| `PUT` | `/overrides/{override_id}` | Super admin | Update an existing permission override. |
| `DELETE` | `/overrides/{override_id}` | Super admin | Delete a permission override. |
| `POST` | `/overrides/bulk` | Super admin | Bulk create or update permission overrides. Body: `{ permissions: [{ user_id, resource, action, is_allowed }] }`. |

### Permission Check

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/check` | `get_current_active_user` | Check if the current user has a specific permission. Returns `{ allowed, resource, action, reason }`. Body: `{ resource, action, scope_type?, scope_id? }`. |

### Audit Log

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/audit-log` | Super admin | Retrieve RBAC audit log. Query params: `limit` (max 200, default 50), `offset`, `action_filter?`, `target_user_id?`. |

---

## Health Check

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | Returns `{ status: "ok", version, ai: { ... } }` with current AI service status. |
| `GET` | `/` | None | Returns a welcome message. |

---

## Error Responses

| HTTP Status | Meaning |
|---|---|
| 400 | Bad request (validation error, duplicate email, etc.) |
| 401 | Unauthorized (missing or invalid JWT token) |
| 402 | Payment required (insufficient discovery credits) |
| 403 | Forbidden (insufficient role or RBAC permission) |
| 404 | Resource not found |
| 409 | Conflict (duplicate role, duplicate permission override) |
| 422 | Unprocessable entity (Pydantic validation failure) |
| 500 | Internal server error |
| 502 | External service error (Influencers Club API failures) |
| 503 | Service unavailable (discovery service not configured) |
