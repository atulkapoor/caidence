# C(AI)DENCE Architecture

## 1. System Overview

C(AI)DENCE is an AI Marketing Intelligence Suite designed for marketing agencies and brands. It provides autonomous campaign management, AI-driven content generation, influencer discovery, CRM workflows, and design tooling under a single multi-tenant platform.

The system is structured as two primary services:

- **Backend**: FastAPI application served on port 8000, handling all business logic, persistence, authentication, and AI orchestration.
- **Frontend**: Next.js 14 application served on port 3000, providing the React-based UI with server and client components via the App Router.

---

## 2. Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI (Python) |
| ORM | SQLAlchemy 2.0 (async, `asyncpg` driver for PostgreSQL, `aiosqlite` for SQLite) |
| Validation | Pydantic v2 / pydantic-settings |
| Auth | python-jose (JWT HS256), passlib + bcrypt |
| LLM | Ollama (local, default model `qwen2.5:0.5b`) |
| Job Queue | Custom job system with Redis (`redis-py`) |
| External API | Influencers Club API |
| Server | Uvicorn (ASGI) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| Presentations | pptxgenjs |
| Calendar | react-big-calendar |
| Toasts | sonner |
| Unit Tests | Vitest + React Testing Library + jsdom |
| E2E Tests | Playwright v1.58.0 |

### Infrastructure
| Component | Dev | Prod |
|---|---|---|
| Database | SQLite (`sql_app.db`) | PostgreSQL 15 |
| LLM | Ollama (local) | Ollama (containerised) |
| Cache/Queue | Redis (optional) | Redis |
| Reverse Proxy | None | Traefik / Nginx (ProxyHeaders trusted) |
| Containerisation | docker-compose.yml | docker-compose.prod.yml |

---

## 3. Backend Structure

### Application Factory

`backend/app/main.py` creates the FastAPI application with a lifespan context manager that runs on startup:

1. **Table creation** — `Base.metadata.create_all` is called against the configured engine (SQLite in dev, PostgreSQL in prod). This is idempotent; tables are only created if they do not exist.
2. **Role seeding** — `seed_roles()` is called to upsert all 8 system roles with their `permissions_json`. This ensures role definitions are always up to date on every restart.

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        await seed_roles(session)
    yield
```

### Middleware

Two middleware layers are registered:

- **CORSMiddleware** — In development (`ENVIRONMENT != "production"`), all origins (`"*"`) are permitted. In production, only the comma-separated values in `ALLOWED_ORIGINS` are allowed.
- **ProxyHeadersMiddleware** (Uvicorn) — Trusts `X-Forwarded-For` and related headers from any upstream proxy. Required for correct IP resolution behind Traefik or Nginx.

### API Router (`backend/app/api/api.py`)

All routes are mounted under the `/api/v1` prefix. The `api_router` registers 24 endpoint groups:

| Prefix | Tag | Description |
|---|---|---|
| `/dashboard` | dashboard | Dashboard summary data |
| `/projects` | projects | Project management |
| `/chat` | chat | AI chat sessions |
| `/content` | content | Content generation |
| `/design` | design | Design asset generation |
| `/workflow` | workflow | Automation workflows |
| `/presentation` | presentation | Presentation studio |
| `/campaigns` | campaigns | Campaign management |
| `/agent` | agent | AI agent tasks |
| `/communications` | communications | Email/comms |
| `/analytics` | analytics | Analytics & reporting |
| `/discovery` | discovery | Influencer discovery |
| `/crm` | crm | CRM contacts and pipeline |
| `/auth` | authentication | Login, register, token refresh |
| `/organizations` | organizations | Agency/org management |
| `/brands` | brands | Brand management |
| `/creators` | creators | Creator roster |
| `/admin` | admin | Platform admin panel |
| `/marcom` | marcom | Marketing communications |
| `/jobs` | jobs | Background job status |
| `/profile` | profile | User profile settings |
| `/teams` | teams | Team management |
| `/rbac` | rbac | Role & permission management |

Full OpenAPI spec is available at `/api/v1/openapi.json`.

### Dependency Injection (`backend/app/api/deps.py`)

The `get_db` dependency provides a scoped `AsyncSession` per request. The auth dependency chain:

```
get_current_user
    └── get_current_active_user
            ├── require_role(*roles)
            ├── require_permission(action, resource)
            ├── require_admin
            ├── require_manager
            └── require_super_admin
```

Convenience permission dependencies (`require_campaign_read`, `require_content_write`, etc.) are pre-built and used directly in route signatures.

---

## 4. Frontend Structure

### App Router Layout

The root layout at `frontend/src/app/layout.tsx` wraps the entire application in two context providers:

```tsx
<PreferencesProvider>
  <PermissionProvider>
    {children}
    <Toaster />
  </PermissionProvider>
</PreferencesProvider>
```

- **PreferencesProvider** — Theme, locale, and user preferences.
- **PermissionProvider** — Loads the current user's effective permissions from the backend on mount and exposes them via `usePermissions()`. `PermissionGate` components conditionally render UI based on `resource:action` checks.

### Key Routes

| Route | Description |
|---|---|
| `/login` | Authentication page |
| `/register` | New user registration |
| `/forgot-password` | Password reset flow |
| `/dashboard` | Main dashboard with campaign summaries |
| `/campaigns` | Campaign list, creation, and analytics |
| `/content-studio` | AI content generation (posts, blogs) |
| `/design-studio` | AI image/design asset generation |
| `/workflow` | Visual workflow automation builder |
| `/ai-agent` | Autonomous AI agent task runner |
| `/ai-chat` | Conversational AI interface |
| `/analytics` | Analytics dashboards |
| `/discovery` | Influencer search and discovery |
| `/creators` | Creator roster management |
| `/crm` | CRM contacts and pipeline |
| `/marcom` | Marketing communications |
| `/presentation-studio` | AI-assisted presentation builder |
| `/settings` | User and account settings |
| `/admin` | Platform administration (RBAC, orgs, users) |
| `/agency` | Agency-level management |
| `/creator-portal` | Creator self-service portal |

### API Layer (`frontend/src/lib/api/`)

All backend communication uses `authenticatedFetch` from `frontend/src/lib/api/core.ts`:

```typescript
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = await getAuthHeaders(); // Reads JWT from localStorage
    const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
    if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login"; // Auto-redirect on token expiry
    }
    return response;
}
```

The JWT token is stored in `localStorage` under the key `"token"`. On a 401 response the token is cleared and the user is redirected to `/login`.

Individual API modules (`campaigns.ts`, `creators.ts`, `auth.ts`, etc.) compose `authenticatedFetch` calls for their respective resource types.

### Permission System (`frontend/src/lib/permissions.ts`)

The frontend mirrors the backend's RBAC model:

- `UserRole` type: `"root" | "super_admin" | "agency_admin" | "agency_member" | "brand_admin" | "brand_member" | "creator" | "viewer"`
- `ROLE_HIERARCHY` — numeric levels (root=110, super_admin=100, … viewer=10) matching the backend exactly.
- `hasPermission(role, permission)` — checks `resource:action` against the `ROLE_PERMISSIONS` map.
- `hasRole(userRole, requiredRole)` — compares hierarchy levels.
- `isSuperAdmin(role)` — returns `true` for `"root"` and `"super_admin"`.

The `ProtectedRoute` component wraps pages that require specific permissions or minimum role levels and redirects to `fallbackPath` if the check fails.

---

## 5. Database Schema

All models inherit from `Base` (SQLAlchemy `DeclarativeBase`) and are registered in `backend/app/models/`.

### Multi-Tenancy Models

#### Organization (`organizations`)
Top-level tenant, representing an agency or company.

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String | |
| slug | String UNIQUE | URL-safe identifier |
| logo_url | String | Nullable |
| plan_tier | String | `free`, `pro`, `enterprise` |
| custom_domain | String UNIQUE | Nullable, e.g. `reports.agency.com` |
| branding_config | JSON | Colors, fonts, login background |
| settings | JSON | Arbitrary org settings |
| is_active | Boolean | |

#### Brand (`brands`)
A client brand within an Organization.

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| organization_id | FK → organizations | |
| name | String | |
| slug | String | |
| logo_url | String | Nullable |
| industry | String | Nullable |
| description | Text | Nullable |
| settings | JSON | Nullable |
| is_active | Boolean | |

#### Team (`teams`)
A sub-group within an Organization.

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String | |
| organization_id | FK → organizations | |

#### Creator (`creators`)
Influencer/talent on a Brand's roster. Can be linked to a User account.

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| brand_id | FK → brands | Nullable (pending approval) |
| user_id | FK → users | Nullable |
| handle | String | |
| platform | String | Instagram, TikTok, YouTube, etc. |
| name | String | |
| category | String | Fashion, Tech, Fitness, etc. |
| tier | String | Nano, Micro, Macro, Mega |
| follower_count | Integer | |
| engagement_rate | Float | |
| status | String | `pending`, `active`, `vetted`, `past`, `blacklisted` |
| affiliate_code | String UNIQUE | Nullable |
| commission_rate | Float | Default 10% |
| contract_status | String | `none`, `pending`, `signed` |

### Core User Model (`users`)

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| email | String UNIQUE | |
| hashed_password | String | Nullable (for invited users) |
| full_name | String | |
| company, location, bio, industry | String/Text | Profile fields |
| organization_id | FK → organizations | Nullable |
| team_id | FK → teams | Nullable |
| role_id | FK → roles | Nullable (RBAC FK) |
| role | String | String shorthand, default `"viewer"` (kept in sync with role_id) |
| is_active | Boolean | |
| is_approved | Boolean | Default False; requires super admin approval |

### Campaign & Activity Models

#### Campaign (`campaigns`)
| Column | Type | Notes |
|---|---|---|
| id, title, status | | `draft`, `active`, `completed` |
| budget, start_date, end_date | Text/DateTime | |
| channels, audience_targeting | Text | JSON-encoded |
| owner_id | FK → users | |

Related: `CampaignInfluencer` (M2M join with status), `CampaignEvent` (analytics events).

#### Other Studio Models
- **ContentGeneration** (`content_generations`) — AI-generated content with platform, content_type, prompt, and result.
- **DesignAsset** (`design_assets`) — AI-generated images with style, aspect_ratio, brand_colors, and base64 image_url.
- **Workflow** (`workflows`) — Automation workflows with `steps_json` and `run_count`. Related `WorkflowRun` tracks execution status and logs.
- **Presentation** (`presentations`) — Slide decks with `slides_json`.
- **ChatMessage** (`chat_messages`) — Chat history grouped by `session_id`.
- **Project** (`projects`) — Strategic projects with `strategy_json` from AI generation.
- **ActivityLog** (`activities`) — User action audit trail.
- **Comment** (`comments`) — Campaign comments.

### Credits & Discovery Models
- **CreditAccount** (`credit_accounts`) — Per-user balance, monthly allotment, and total_spent.
- **CreditTransaction** (`credit_transactions`) — Immutable ledger of credit debits/credits with before/after balances.
- **CreatorSearch** (`creator_searches`) — Log of Influencers Club API searches for analytics and caching.

### RBAC Models (`backend/app/models/rbac.py`)

#### Role (`roles`)
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String UNIQUE | `root`, `super_admin`, `agency_admin`, etc. |
| display_name | String | |
| hierarchy_level | Integer | 110=root → 10=viewer |
| permissions_json | JSON | `{"resource": ["action", ...]}` |

#### Permission (`permissions`)
Granular per-user overrides. Supports explicit allow and explicit deny.

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| user_id | FK → users | |
| resource | String | e.g. `"campaigns"`, `"crm"` |
| action | String | `"read"`, `"write"`, `"none"` |
| scope_type | String | `"global"`, `"organization"`, `"team"` |
| scope_id | Integer | Nullable; ID of the scoped entity |
| is_allowed | Boolean | `True` = allow, `False` = deny |

#### AuditLog (`audit_log`)
Tracks all RBAC mutations (role assignments, permission grants/revokes, role edits).

| Column | Type | Notes |
|---|---|---|
| actor_id / actor_email | FK/String | Who made the change |
| action | String | e.g. `"role_assigned"`, `"permission_granted"` |
| target_user_id / target_user_email | FK/String | Who was affected |
| details | JSON | Arbitrary metadata (old/new role, etc.) |

#### AccessLog (`access_logs`)
Tracks all access control decisions for security monitoring and audit.

| Column | Type | Notes |
|---|---|---|
| user_id / user_email / user_role | | Requesting user |
| endpoint / method | String | HTTP endpoint and verb |
| resource / action | String | What was requested |
| result | String | `"allowed"` or `"denied"` |
| reason | String | Why access was denied |
| ip_address | String | Client IP |

---

## 6. Multi-Tenancy Model

The platform enforces a 4-tier hierarchy:

```
Platform (root / super_admin)
    └── Agency / Organization
            └── Brand
                    └── Creator
```

- **Platform tier** (`root`, `super_admin`) — No organization affiliation. Can see and manage all data across all tenants.
- **Agency tier** (`agency_admin`, `agency_member`) — Scoped to a single `Organization`. Can manage all `Brand`s and `Creator`s within that org.
- **Brand tier** (`brand_admin`, `brand_member`) — Scoped to a specific `Brand` within an org. Can manage creators assigned to that brand.
- **Creator tier** (`creator`) — Individual creator user with access limited to their own content tools.

### Tenant Filter Implementation (`backend/app/core/tenant_filter.py`)

The `tenant_filter.py` module provides composable query filters applied by endpoint handlers:

- `apply_org_filter(query, model, user)` — Appends `WHERE organization_id = user.organization_id` unless the user is a super admin.
- `apply_brand_filter(query, model, user)` — Agency-level users see all brands; brand-level users see only their assigned brand.
- `apply_team_filter(query, model, user)` — Restricts to `user.team_id` for non-admin users.
- `apply_tenant_filters(query, model, user)` — Convenience wrapper applying all three filters in sequence, only for fields that exist on the model.
- `ensure_tenant_access(user, resource_id, db, model)` — Fetches a specific resource and raises `403` if the user's org/brand/owner boundaries are violated.

---

## 7. RBAC Engine

The `PermissionEngine` class (`backend/app/services/permission_engine.py`) is the single point of permission evaluation.

### Resolution Order

```
1. Super Admin / Root bypass              → ALLOW (unconditionally)
2. Explicit DENY override (is_allowed=False) → DENY
3. Explicit ALLOW override (is_allowed=True) → ALLOW
4. Role default (Role.permissions_json)   → ALLOW or DENY
5. Default fallback                       → DENY
```

### Scope Cascade

Permissions can be scoped from widest to narrowest:

```
Global > Organization > Brand > Team
```

A permission granted at a wider scope applies automatically at narrower scopes. When checking, the most specific matching scope takes precedence. Explicit denies at any scope override allows.

### Role Hierarchy

| Role | Level | Description |
|---|---|---|
| `root` | 110 | Platform root, unrestricted |
| `super_admin` | 100 | Platform administrator |
| `agency_admin` | 80 | Agency-level administrator |
| `agency_member` | 60 | Agency team member |
| `brand_admin` | 50 | Brand-level administrator |
| `brand_member` | 40 | Brand team member |
| `creator` | 20 | Content creator |
| `viewer` | 10 | Read-only access |

### Profile Type Role Constraints (`PROFILE_TYPE_ROLE_CONSTRAINTS`)

Certain profile types restrict which roles can be assigned:

| Profile Type | Allowed Roles |
|---|---|
| `agency` | `root`, `super_admin`, `agency_admin`, `agency_member` |
| `brand` | `brand_admin`, `brand_member` |
| `creator` | `creator` |

### Role Assignment Rules

- `root` can assign any role.
- A user cannot assign a role at or above their own hierarchy level.
- Non-super-admin users can only assign roles to users within their own organization.

### Usage

```python
# Load from DB (eager-loads permissions + role)
engine = await PermissionEngine.for_user(user_id, db)

# Or from an already-loaded User
engine = PermissionEngine.from_loaded_user(current_user)

# Check a single permission
allowed = engine.has_permission("campaign", "write")

# Get all effective permissions (for frontend sync)
perms = engine.get_effective_permissions()  # Set of "resource:action" strings
# Super admins return {"*:*"}
```

---

## 8. Auth Flow

### Login

1. Client `POST /api/v1/auth/login` with `username` (email) and `password` as `application/x-www-form-urlencoded` (OAuth2 password flow).
2. Backend verifies password with bcrypt via `passlib`.
3. On success, a JWT is issued using `python-jose` with HS256 algorithm. Default expiry: **30 minutes** (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`).
4. JWT payload contains: `user_id`, `email`, `role`, `organization_id`, and `exp`.

### Token Validation

The `OAuth2PasswordBearer` scheme extracts the `Bearer` token from the `Authorization` header.

Dependency chain used by protected endpoints:

```
OAuth2PasswordBearer (tokenUrl="/api/v1/auth/login")
    └── get_current_user()
            ├── decode_access_token() → TokenData
            ├── DB lookup: SELECT User WHERE id = token_data.user_id
            │       (eager-loads custom_permissions)
            └── Returns User or 401
        └── get_current_active_user()
                ├── Checks user.is_active → 400 if False
                ├── Checks user.is_approved → 403 if False
                └── Returns User
```

**Development fallback**: When no token is provided and `ENVIRONMENT != "production"` and `DISABLE_MOCK_USER != "true"`, `get_current_user` returns a mock `super_admin` user. This fallback never activates in production.

### Frontend Token Handling

- Token stored in `localStorage["token"]`.
- Every API call attaches `Authorization: Bearer <token>` via `authenticatedFetch`.
- On `401` response, token is removed from localStorage and user is redirected to `/login`.
