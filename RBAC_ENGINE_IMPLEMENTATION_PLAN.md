# Robust RBAC Engine - Gap Analysis & Implementation Plan

> C(AI)DENCE Marketing Intelligence Suite
> Created: February 2026 | Scope: Complete RBAC Overhaul

---

## Table of Contents

1. [Gap Analysis - Current State Audit](#1-gap-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Permission Model Redesign](#3-permission-model)
4. [Implementation Plan](#4-implementation-plan)
5. [Database Schema](#5-database-schema)
6. [API Specification](#6-api-specification)
7. [Frontend Redesign](#7-frontend-redesign)
8. [Migration Strategy](#8-migration-strategy)
9. [Testing Plan](#9-testing-plan)

---

## 1. Gap Analysis - Current State Audit

### 1.1 Critical Gaps (Security Risks)

| # | Gap | Location | Severity | Impact |
|---|-----|----------|----------|--------|
| **G-01** | **Hardcoded SECRET_KEY** | `auth_service.py:11` | **CRITICAL** | JWT tokens can be forged by anyone who reads the source code. `"cadence-super-secret-key-change-in-production"` is in plaintext. Must move to `config.settings.SECRET_KEY` with env var. |
| **G-02** | **Mock user bypasses all auth in development** | `deps.py:33-48` | **HIGH** | `get_current_user()` returns a mock `super_admin` (id=1) when no token is provided. Even with `auto_error=False` on OAuth2 scheme, any request without a token gets full admin access. Exception handling on line 84 also falls back to mock user, meaning ANY malformed token gives admin access. |
| **G-03** | **Role assignment lacks hierarchy validation** | `rbac.py:50-61` | **HIGH** | An `agency_admin` (level 80) could theoretically assign someone `super_admin` (level 100) because the code only checks `role != "root"` - it never compares the assigner's hierarchy level vs the target role's level. Line 57 says: `"Simplified: super_admin can assign anything except root"`. |
| **G-04** | **No org-scoped permission validation on role assignment** | `rbac.py:52-54` | **HIGH** | Cross-org check exists but uses `current_user.organization_id != target_user.organization_id` - this fails for super_admins who may have `organization_id=None`. Also, `agency_admin` can assign roles to ANY user in their org, including elevating other admin roles. |
| **G-05** | **Permission overrides ignore `is_allowed` field** | `deps.py:125-137` | **MEDIUM** | The `Permission` model has `is_allowed = Column(Boolean)` for explicit deny, but `require_permission()` never reads this field. It only checks `action` values ("write"/"read"/"none"). Explicit deny overrides are impossible. |
| **G-06** | **Organization filtering is manual, not centralized** | All endpoint files | **MEDIUM** | Every endpoint manually adds `.where(Model.organization_id == current_user.organization_id)`. If a developer forgets this on a new endpoint, it's a cross-tenant data leak. There are 11+ endpoint files with manual org filtering. |

### 1.2 Architectural Gaps (Design Issues)

| # | Gap | Location | Severity | Impact |
|---|-----|----------|----------|--------|
| **G-07** | **`Role.permissions_json` is stored but never queried** | `rbac.py:17`, `deps.py:113-121` | **HIGH** | The `Role` model stores `permissions_json` (e.g., `{"campaigns": ["create", "read"]}`) but `require_permission()` uses a completely separate hardcoded `role_permissions_map` dict in `deps.py:113-121`. This means: (a) Role permissions can't be changed without code deploy, (b) The DB-stored role permissions are dead data. |
| **G-08** | **Backend and frontend role sets don't match** | `auth_service.py:71-80` vs `permissions.ts:5-12` | **MEDIUM** | Backend defines 8 roles: `root, super_admin, agency_admin, agency_member, brand_admin, brand_member, creator, viewer`. Frontend defines 7 roles (missing `root`). The hardcoded `role_permissions_map` in `deps.py:113-121` uses completely different role names: `admin, manager, editor, viewer` - which don't exist in either the User model or frontend. |
| **G-09** | **Permission granularity mismatch between backend and frontend** | `deps.py` vs `permissions.ts` | **MEDIUM** | Backend permissions: `campaign:read`, `campaign:write`, `content:read`, `content:write`, etc. Frontend permissions: `campaign:view`, `campaign:manage`, `admin:access`, `brand:create`, etc. These are different permission languages - the frontend can't accurately reflect what the backend enforces. |
| **G-10** | **No resource-level (row-level) permissions** | Entire system | **MEDIUM** | RBAC is at the module level ("can you access campaigns?") but not at the resource level ("can you access campaign #42?"). The `Permission` model has `scope_type` and `scope_id` columns for this, but they're never used in `require_permission()`. |
| **G-11** | **Team-level scoping is defined but never enforced** | `team.py`, `deps.py` | **MEDIUM** | `Team` model exists, `User.team_id` exists, `Permission.scope_type` supports "team" value, but NO endpoint filters data by team. A team member sees all data in their organization. |
| **G-12** | **No brand-level data isolation** | All endpoints | **MEDIUM** | In the ABC profile model, a Brand is a sub-entity of an Organization. But no endpoint filters by `brand_id`. A user assigned to Brand A can see Brand B's data within the same org. |

### 1.3 Functional Gaps (Missing Features)

| # | Gap | Location | Severity | Impact |
|---|-----|----------|----------|--------|
| **G-13** | **No permission audit log** | Entire system | **MEDIUM** | When admin changes a user's role or permissions, there's no audit trail. Critical for compliance (SOC2, GDPR). |
| **G-14** | **No role management CRUD** | `rbac.py` endpoints | **MEDIUM** | Only 2 endpoints exist: `GET /roles` (list) and `POST /assign` (assign to user). No create/update/delete role. Admins can't create custom roles or modify role permissions. |
| **G-15** | **Admin panel permission UI shows wrong defaults** | `AccessControlTab.tsx:186-188` | **LOW** | `isEnabled = perm ? perm.action === 'write' : isSuperAdmin`. For non-super_admin users without custom overrides, ALL toggles show "off" even if their role grants access. There's no way to distinguish "inherited from role" vs "explicitly denied". |
| **G-16** | **No permission caching** | `deps.py:108-146` | **LOW** | Every API request queries the user + custom_permissions from DB via `selectinload`. No Redis/in-memory caching. At scale, this adds latency to every authenticated request. |
| **G-17** | **No API rate limiting per role** | Entire system | **LOW** | All roles have identical rate limits (none). Higher-tier roles should have higher limits. Free-tier viewers should be throttled. |
| **G-18** | **No invitation-based role assignment** | `admin.py:256-294` | **LOW** | Admin invite creates users with a raw password. No email invitation link flow, no role acceptance workflow, no invite expiry. |
| **G-19** | **No "profile_type" integration with RBAC** | `deps.py`, `permissions.ts` | **MEDIUM** | The ABC profiles plan adds `profile_type` (agency/brand/creator) to User, but the RBAC system doesn't use it. A user with `profile_type=creator` and `role=super_admin` would get full admin access, which may not be intended. Profile type should constrain available roles. |
| **G-20** | **Duplicate `require_super_admin` definitions** | `deps.py:239` and `admin.py:24` | **LOW** | Two separate implementations of the same function. The one in `admin.py` imports from `auth_service.is_super_admin()`, while `deps.py` does a direct string comparison. They behave slightly differently (admin.py accepts "root", deps.py does not). |

### 1.4 Gap Severity Summary

```
CRITICAL:  1  (G-01: Hardcoded secret key)
HIGH:      4  (G-02, G-03, G-04, G-07)
MEDIUM:    9  (G-05, G-06, G-08, G-09, G-10, G-11, G-12, G-13, G-19)
LOW:       6  (G-14, G-15, G-16, G-17, G-18, G-20)
─────────────
TOTAL:    20 gaps identified
```

---

## 2. Target Architecture

### 2.1 Design Principles

1. **Database-Driven Permissions** - All role permissions stored in DB, not hardcoded
2. **Hierarchical Enforcement** - Users can only manage roles at or below their hierarchy level
3. **Multi-Scope Access Control** - Global > Organization > Brand > Team > Resource scoping
4. **Explicit Allow/Deny** - Support both grant and revoke at every scope level
5. **Profile-Type Constraints** - Profile type (A/B/C) constrains which roles are assignable
6. **Centralized Filtering** - Middleware-based org/brand/team filtering, not per-endpoint
7. **Audit Everything** - Every permission change, role assignment, and access denial is logged
8. **Cache Permissions** - Per-request permission evaluation cached in memory, bulk cache in Redis

### 2.2 Architecture Diagram

```
                         Request with JWT Token
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   1. JWT Validation       │
                    │   (decode, verify expiry) │
                    └──────────┬───────────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                    │   2. User Resolution      │
                    │   (load user + relations) │
                    └──────────┬───────────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                    │   3. Permission Engine     │
                    │   ┌────────────────────┐  │
                    │   │ Load Role Perms    │  │  ← FROM DB (Role.permissions_json)
                    │   │ (DB / Redis Cache) │  │
                    │   └────────┬───────────┘  │
                    │            │               │
                    │   ┌────────▼───────────┐  │
                    │   │ Apply Custom       │  │  ← Per-user overrides
                    │   │ Permission Overrides│  │    (allow / deny)
                    │   └────────┬───────────┘  │
                    │            │               │
                    │   ┌────────▼───────────┐  │
                    │   │ Apply Profile Type  │  │  ← Agency/Brand/Creator
                    │   │ Constraints         │  │    role restrictions
                    │   └────────┬───────────┘  │
                    │            │               │
                    │   ┌────────▼───────────┐  │
                    │   │ Evaluate Scope     │  │  ← Global > Org > Brand
                    │   │ (Org/Brand/Team)   │  │    > Team > Resource
                    │   └────────┬───────────┘  │
                    │            │               │
                    │   ┌────────▼───────────┐  │
                    │   │ Decision:          │  │
                    │   │ ALLOW / DENY       │  │
                    │   └────────┬───────────┘  │
                    │            │               │
                    │   ┌────────▼───────────┐  │
                    │   │ Audit Log Entry    │  │  ← Log decision (async)
                    │   └────────────────────┘  │
                    └──────────┬───────────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                    │   4. Data Scope Filter    │
                    │   (auto-apply org/brand/  │
                    │    team WHERE clauses)    │
                    └──────────┬───────────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                    │   5. Endpoint Logic       │
                    │   (business logic only,   │
                    │    no auth/filter code)    │
                    └──────────────────────────┘
```

### 2.3 Permission Resolution Order (Precedence)

```
1. Super Admin / Root    → ALLOW everything (bypass all checks)
2. Explicit User DENY    → DENY (highest priority override)
3. Explicit User ALLOW   → ALLOW (user-level grant)
4. Role permissions_json → Check role's stored permissions
5. Default               → DENY (secure by default)
```

### 2.4 Scope Hierarchy

```
Global (platform-wide)
  └── Organization (agency-level)
       └── Brand (brand-level)
            └── Team (team-level)
                 └── Resource (specific campaign/content/etc.)
```

A permission granted at a higher scope cascades down UNLESS explicitly denied at a lower scope.

---

## 3. Permission Model Redesign

### 3.1 Unified Permission Language

Replace the inconsistent backend/frontend permission naming with a single, unified system:

```
Format: {resource}:{action}

Resources:
  platform      - Platform-level settings (super_admin only)
  organization  - Organization management
  billing       - Billing and subscription
  team          - Team management
  brand         - Brand management
  creator       - Creator roster management
  campaign      - Campaign management
  content       - Content studio
  design        - Design studio
  presentation  - Presentation studio
  video         - Video/Reels studio
  banner        - Banner studio
  discovery     - Creator discovery
  analytics     - Analytics dashboards
  crm           - CRM and relationships
  marcom        - Marketing communications
  workflow      - Workflow automation
  ai_chat       - AI chat
  ai_agent      - AI agent
  social        - Social connections and publishing
  leads         - Lead management
  integrations  - Third-party integrations

Actions:
  read          - View/list resources
  create        - Create new resources
  update        - Modify existing resources
  delete        - Remove resources
  publish       - Publish/schedule (for social, content)
  approve       - Approve workflows, users, content
  export        - Export/download data
  admin         - Full administrative control over the resource
```

### 3.2 Role Definitions (Database-Stored)

| Role | Hierarchy | Profile Type | Permissions |
|------|-----------|-------------|-------------|
| **root** | 110 | any | `*:*` (everything) |
| **super_admin** | 100 | agency | `platform:admin`, `organization:admin`, `billing:admin`, all `*:admin` |
| **agency_admin** | 80 | agency | `organization:read`, `brand:admin`, `team:admin`, `creator:admin`, `campaign:admin`, `content:admin`, `design:admin`, `discovery:admin`, `analytics:admin`, `crm:admin`, `workflow:admin`, `social:admin`, `leads:admin` |
| **agency_member** | 60 | agency | `brand:read`, `creator:read`, `campaign:read`, `content:read,create`, `design:read,create`, `discovery:read`, `analytics:read`, `crm:read`, `social:read` |
| **brand_admin** | 50 | brand | `brand:read,update`, `creator:admin`, `campaign:admin`, `content:admin`, `design:admin`, `discovery:read`, `analytics:read`, `crm:read,create,update`, `social:admin`, `leads:read` |
| **brand_member** | 40 | brand | `brand:read`, `creator:read`, `campaign:read`, `content:read,create`, `design:read,create`, `discovery:read`, `analytics:read` |
| **creator** | 20 | creator | `content:read,create`, `campaign:read` (own assignments), `analytics:read` (own metrics), `social:read` (own connections) |
| **viewer** | 10 | any | `content:read`, `campaign:read`, `analytics:read` |

### 3.3 Profile Type → Role Constraints

| Profile Type | Allowed Roles | Default Role |
|-------------|--------------|-------------|
| **agency** | root, super_admin, agency_admin, agency_member, viewer | agency_member |
| **brand** | brand_admin, brand_member, viewer | brand_member |
| **creator** | creator, viewer | creator |

This prevents a creator from being assigned `super_admin` or an agency user from being assigned `creator`.

---

## 4. Implementation Plan

### Phase R1: Critical Security Fixes (Immediate)

| Task ID | Task | Description | Files | Hours | Priority |
|---------|------|-------------|-------|-------|----------|
| R1-001 | Move SECRET_KEY to env var | Replace hardcoded key with `settings.SECRET_KEY`, add to `.env.example` | `auth_service.py`, `config.py`, `.env.example` | 1 | **P0** |
| R1-002 | Remove mock user fallback in production | Add `settings.ENVIRONMENT` check, only allow mock in `development` mode with explicit flag | `deps.py` | 2 | **P0** |
| R1-003 | Fix exception handler in get_current_user | Line 84 catches ALL exceptions and returns mock user. Must only catch specific JWT errors | `deps.py` | 1 | **P0** |
| R1-004 | Fix hierarchy validation in role assignment | Compare `assigner.hierarchy_level >= target_role.hierarchy_level`. Query both from DB | `rbac.py` endpoint | 3 | **P0** |
| R1-005 | Unify duplicate require_super_admin | Remove from `admin.py`, use single source from `deps.py` (accepting both "root" and "super_admin") | `admin.py`, `deps.py` | 1 | **P0** |
| **Subtotal** | | | | **8 hrs** | |

### Phase R2: Permission Engine Core

| Task ID | Task | Description | Files | Hours | Priority |
|---------|------|-------------|-------|-------|----------|
| R2-001 | Create PermissionEngine service | Central class that evaluates permissions using DB roles + user overrides + scope | `backend/app/services/permission_engine.py` (new) | 12 | **P0** |
| R2-002 | Switch to DB-driven role permissions | Read `Role.permissions_json` instead of hardcoded `role_permissions_map` dict | `deps.py`, `permission_engine.py` | 4 | **P0** |
| R2-003 | Implement `is_allowed` field logic | Support explicit DENY overrides in Permission model. Deny > Allow > Role Default > Deny | `permission_engine.py` | 3 | **P0** |
| R2-004 | Implement scope evaluation | Check permission at Global > Org > Brand > Team levels. Higher scope cascades down | `permission_engine.py` | 6 | **P0** |
| R2-005 | Implement profile_type constraints | Validate that role assignment respects profile_type restrictions | `permission_engine.py`, `rbac.py` | 3 | **P1** |
| R2-006 | Create centralized org/brand filter middleware | FastAPI middleware that auto-applies `organization_id` and `brand_id` WHERE clauses | `backend/app/middleware/tenant_filter.py` (new) | 8 | **P0** |
| R2-007 | Create `@require_scope` decorator | Decorator that checks org + brand + team scope access for the current request | `backend/app/core/decorators.py` (new) | 4 | **P1** |
| R2-008 | Replace all manual org filters in endpoints | Remove manual `.where(organization_id == ...)` from all 11 endpoint files, use middleware | All `endpoints/*.py` files | 6 | **P0** |
| R2-009 | Seed Role.permissions_json with correct data | Populate roles table with proper permissions_json for all 8 roles | `backend/app/seeds/seed_roles.py` (new) | 3 | **P0** |
| R2-010 | Alembic migration for schema changes | Add new columns, update existing data | `backend/alembic/versions/xxx_rbac_v2.py` (new) | 2 | **P0** |
| **Subtotal** | | | | **51 hrs** | |

### Phase R3: Role & Permission Management API

| Task ID | Task | Description | Files | Hours | Priority |
|---------|------|-------------|-------|-------|----------|
| R3-001 | Role CRUD endpoints | Create, update, delete roles (super_admin only). Validate hierarchy constraints | `backend/app/api/endpoints/rbac.py` (rewrite) | 6 | **P0** |
| R3-002 | Role permissions editor endpoint | Update `permissions_json` for a role. Validate against master permission list | `backend/app/api/endpoints/rbac.py` | 4 | **P0** |
| R3-003 | User permission override CRUD | Full CRUD for per-user permission overrides with scope support | `backend/app/api/endpoints/rbac.py` | 4 | **P0** |
| R3-004 | Effective permissions endpoint | `GET /api/v1/rbac/users/{id}/effective-permissions` - returns merged view of role + overrides | `backend/app/api/endpoints/rbac.py` | 3 | **P0** |
| R3-005 | Permission audit log endpoint | `GET /api/v1/rbac/audit-log` - list all permission/role changes with who/what/when | `backend/app/api/endpoints/rbac.py` | 3 | **P1** |
| R3-006 | Bulk permission update endpoint | Update permissions for multiple users at once (e.g., entire team) | `backend/app/api/endpoints/rbac.py` | 3 | **P1** |
| R3-007 | Permission check endpoint | `POST /api/v1/rbac/check` - check if current user has specific permission (for frontend) | `backend/app/api/endpoints/rbac.py` | 2 | **P1** |
| R3-008 | Updated Pydantic schemas | New schemas for Role CRUD, Permission CRUD, AuditLog, EffectivePermissions | `backend/app/schemas/rbac_schemas.py` (rewrite) | 3 | **P0** |
| **Subtotal** | | | | **28 hrs** | |

### Phase R4: Audit & Logging

| Task ID | Task | Description | Files | Hours | Priority |
|---------|------|-------------|-------|-------|----------|
| R4-001 | Create PermissionAuditLog model | Track all permission/role changes: who changed what, old value, new value, timestamp | `backend/app/models/rbac.py` (extend) | 2 | **P0** |
| R4-002 | Create AccessLog model | Track access denied events for security monitoring | `backend/app/models/rbac.py` (extend) | 2 | **P1** |
| R4-003 | Implement audit logging in permission engine | Log every permission evaluation (async, non-blocking) | `permission_engine.py` | 4 | **P1** |
| R4-004 | Implement audit logging in role assignment | Log role changes with before/after values | `rbac.py` endpoints | 2 | **P0** |
| R4-005 | Implement audit logging in permission overrides | Log override create/update/delete | `rbac.py` endpoints | 2 | **P0** |
| R4-006 | Security alerts for suspicious activity | Detect: mass permission changes, privilege escalation attempts, cross-org access attempts | `backend/app/services/security_alert_service.py` (new) | 4 | **P2** |
| R4-007 | Alembic migration for audit tables | New tables: `permission_audit_logs`, `access_logs` | Migration file | 1 | **P0** |
| **Subtotal** | | | | **17 hrs** | |

### Phase R5: Frontend RBAC Redesign

| Task ID | Task | Description | Files | Hours | Priority |
|---------|------|-------------|-------|-------|----------|
| R5-001 | Unify permission language with backend | Rewrite `permissions.ts` to use same `{resource}:{action}` format as backend | `frontend/src/lib/permissions.ts` (rewrite) | 4 | **P0** |
| R5-002 | Create PermissionContext provider | React context that loads effective permissions from API on login, caches in state | `frontend/src/contexts/PermissionContext.tsx` (new) | 6 | **P0** |
| R5-003 | Create `<PermissionGate>` component | `<PermissionGate require="campaign:create">...</PermissionGate>` - renders children only if permitted | `frontend/src/components/rbac/PermissionGate.tsx` (new) | 3 | **P0** |
| R5-004 | Create `usePermission()` hook | `const canCreate = usePermission("campaign:create")` - boolean hook for inline checks | `frontend/src/hooks/usePermission.ts` (new) | 2 | **P0** |
| R5-005 | Redesign AccessControlTab | Show inherited permissions (from role) vs custom overrides. Add allow/deny distinction. Three states: Inherited (gray), Granted (green), Denied (red) | `frontend/src/components/admin/AccessControlTab.tsx` (rewrite) | 8 | **P0** |
| R5-006 | Role management UI | Create/edit/delete roles, edit role permissions matrix, set hierarchy level | `frontend/src/app/admin/roles/page.tsx` (new) | 10 | **P1** |
| R5-007 | Audit log viewer UI | Searchable, filterable table of permission changes with who/what/when | `frontend/src/app/admin/audit/page.tsx` (new) | 6 | **P1** |
| R5-008 | Update all pages to use PermissionGate | Wrap action buttons, tabs, and sections with `<PermissionGate>` across all 29 pages | All page files | 8 | **P0** |
| R5-009 | Update sidebar to use permission checks | Show/hide sidebar items based on effective permissions, not just role level | `frontend/src/components/layout/Sidebar.tsx` (modify) | 4 | **P0** |
| R5-010 | Frontend RBAC API client | `rbac.ts` - roles CRUD, permissions, effective permissions, audit log | `frontend/src/lib/api/rbac.ts` (new) | 3 | **P0** |
| R5-011 | Brand-scoped permission UI | Show which brand a user has access to, toggle per-brand access | `frontend/src/components/admin/BrandAccessPanel.tsx` (new) | 5 | **P1** |
| **Subtotal** | | | | **59 hrs** | |

### Phase R6: Advanced Features

| Task ID | Task | Description | Files | Hours | Priority |
|---------|------|-------------|-------|-------|----------|
| R6-001 | Permission caching (Redis) | Cache effective permissions per user in Redis with 5-min TTL. Invalidate on change | `permission_engine.py`, `backend/app/core/cache.py` (new) | 6 | **P1** |
| R6-002 | API rate limiting per role | Implement per-role rate limits: viewer=60/min, member=120/min, admin=300/min, super_admin=unlimited | `backend/app/middleware/rate_limiter.py` (new) | 6 | **P1** |
| R6-003 | Invitation-based role assignment | Email invitation with magic link, role pre-assigned, expires in 7 days | `backend/app/services/invitation_service.py` (new), `backend/app/api/endpoints/invitations.py` (new) | 8 | **P1** |
| R6-004 | Brand-level data isolation | Extend tenant filter middleware to filter by `brand_id` when user is brand-scoped | `backend/app/middleware/tenant_filter.py` (extend) | 5 | **P1** |
| R6-005 | Team-level data isolation | Extend tenant filter middleware to filter by `team_id` within org/brand scope | `backend/app/middleware/tenant_filter.py` (extend) | 4 | **P2** |
| R6-006 | Resource-level permissions | Allow granting access to specific campaign IDs or content IDs to specific users | `permission_engine.py` (extend) | 5 | **P2** |
| R6-007 | Permission templates | Pre-built permission sets: "Content Creator", "Campaign Manager", "Analytics Viewer" that can be applied to users | `backend/app/models/rbac.py` (extend), `rbac.py` endpoints | 4 | **P2** |
| R6-008 | Session management | Track active sessions per user, force logout, max concurrent sessions | `backend/app/services/session_service.py` (new) | 6 | **P2** |
| R6-009 | Two-factor authentication | TOTP-based 2FA for admin roles, optional for others | `backend/app/services/tfa_service.py` (new) | 8 | **P2** |
| R6-010 | IP allowlisting per org | Restrict API access to specific IP ranges per organization | `backend/app/middleware/ip_filter.py` (new) | 4 | **P2** |
| **Subtotal** | | | | **56 hrs** | |

### Phase R7: Testing

| Task ID | Task | Description | Files | Hours | Priority |
|---------|------|-------------|-------|-------|----------|
| R7-001 | Permission engine unit tests | Test all evaluation paths: role perms, overrides, deny, scope, profile_type | `backend/tests/test_permission_engine.py` (new) | 8 | **P0** |
| R7-002 | Role assignment security tests | Test hierarchy enforcement, cross-org prevention, profile_type constraints | `backend/tests/test_rbac_security.py` (new) | 5 | **P0** |
| R7-003 | Tenant isolation tests | Verify org, brand, team filtering across all endpoints | `backend/tests/test_tenant_isolation.py` (new) | 6 | **P0** |
| R7-004 | Audit log tests | Verify all permission changes are logged correctly | `backend/tests/test_audit_log.py` (new) | 3 | **P1** |
| R7-005 | Frontend permission tests | Test PermissionGate, usePermission, PermissionContext | `frontend/src/**/__tests__/rbac.test.tsx` (new) | 5 | **P1** |
| R7-006 | E2E RBAC flow tests | Full flow: create role, assign to user, verify access, override permission, verify again | `frontend/tests/e2e/rbac.spec.ts` (new) | 6 | **P1** |
| R7-007 | Penetration testing scenarios | Test privilege escalation, cross-tenant access, token manipulation, replay attacks | `backend/tests/test_security_pentest.py` (new) | 5 | **P1** |
| **Subtotal** | | | | **38 hrs** | |

---

## 5. Database Schema

### 5.1 Updated Role Model

```sql
-- Update existing roles table
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;  -- System roles can't be deleted
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT NULL;    -- Max users with this role (null=unlimited)
ALTER TABLE roles ADD COLUMN IF NOT EXISTS allowed_profile_types JSONB DEFAULT '["agency", "brand", "creator"]';

-- Ensure permissions_json has proper structure
-- Example permissions_json:
-- {
--   "campaign": ["read", "create", "update", "delete"],
--   "content": ["read", "create"],
--   "analytics": ["read"],
--   "discovery": ["read"]
-- }
```

### 5.2 Updated Permission Model

```sql
-- Update existing permissions table
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS granted_by INTEGER REFERENCES users(id);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS reason TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_permissions_user_resource ON permissions(user_id, resource);
CREATE INDEX IF NOT EXISTS idx_permissions_scope ON permissions(scope_type, scope_id);
```

### 5.3 New: Permission Audit Log

```sql
CREATE TABLE permission_audit_logs (
    id SERIAL PRIMARY KEY,

    -- Who made the change
    actor_id INTEGER NOT NULL REFERENCES users(id),
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    actor_ip VARCHAR(45),

    -- What changed
    action VARCHAR(50) NOT NULL,  -- role_assigned, role_removed, permission_granted, permission_denied, permission_removed, user_approved, user_deactivated
    target_user_id INTEGER REFERENCES users(id),
    target_email VARCHAR(255),

    -- Change details
    resource_type VARCHAR(50),  -- role, permission, user_status
    resource_id INTEGER,
    old_value JSONB,            -- {"role": "viewer", "permissions": {...}}
    new_value JSONB,            -- {"role": "agency_admin", "permissions": {...}}

    -- Context
    organization_id INTEGER REFERENCES organizations(id),
    brand_id INTEGER REFERENCES brands(id),
    reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON permission_audit_logs(actor_id);
CREATE INDEX idx_audit_target ON permission_audit_logs(target_user_id);
CREATE INDEX idx_audit_org ON permission_audit_logs(organization_id);
CREATE INDEX idx_audit_created ON permission_audit_logs(created_at);
```

### 5.4 New: Access Log (Security Monitoring)

```sql
CREATE TABLE access_logs (
    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id),
    user_email VARCHAR(255),
    user_role VARCHAR(50),

    -- Request details
    method VARCHAR(10),         -- GET, POST, PUT, DELETE
    path VARCHAR(500),
    resource VARCHAR(50),       -- campaign, content, etc.
    action VARCHAR(50),         -- read, create, update, delete

    -- Decision
    decision VARCHAR(10) NOT NULL,  -- allowed, denied
    denial_reason TEXT,

    -- Context
    organization_id INTEGER,
    brand_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partitioned by month for performance (optional, for large scale)
CREATE INDEX idx_access_log_user ON access_logs(user_id, created_at);
CREATE INDEX idx_access_log_denied ON access_logs(decision) WHERE decision = 'denied';
```

---

## 6. API Specification

### 6.1 New/Updated RBAC Endpoints

```
# ─── Role Management (super_admin only) ───
GET    /api/v1/rbac/roles                          → List all roles
POST   /api/v1/rbac/roles                          → Create custom role
GET    /api/v1/rbac/roles/{role_id}                → Role details + permissions
PUT    /api/v1/rbac/roles/{role_id}                → Update role name/description/hierarchy
PUT    /api/v1/rbac/roles/{role_id}/permissions     → Update role permissions_json
DELETE /api/v1/rbac/roles/{role_id}                → Delete non-system role

# ─── Role Assignment ───
POST   /api/v1/rbac/assign                         → Assign role to user (with hierarchy check)
POST   /api/v1/rbac/bulk-assign                    → Assign role to multiple users

# ─── Permission Overrides (admin+) ───
GET    /api/v1/rbac/users/{user_id}/permissions     → List user's custom overrides
POST   /api/v1/rbac/users/{user_id}/permissions     → Add permission override (allow or deny)
PUT    /api/v1/rbac/users/{user_id}/permissions/{id} → Update override
DELETE /api/v1/rbac/users/{user_id}/permissions/{id} → Remove override

# ─── Effective Permissions ───
GET    /api/v1/rbac/users/{user_id}/effective       → Merged view: role + overrides + scope
GET    /api/v1/rbac/me/effective                    → Current user's effective permissions
POST   /api/v1/rbac/check                           → Check: does user X have permission Y?

# ─── Audit Log ───
GET    /api/v1/rbac/audit-log                       → List audit entries (filter by actor, target, date)
GET    /api/v1/rbac/audit-log/user/{user_id}       → Audit log for specific user

# ─── Permission Templates ───
GET    /api/v1/rbac/templates                       → List permission templates
POST   /api/v1/rbac/templates                       → Create template
POST   /api/v1/rbac/templates/{id}/apply/{user_id}  → Apply template to user

# ─── Security ───
GET    /api/v1/rbac/access-log                      → Access log (denied requests)
GET    /api/v1/rbac/sessions                        → Active user sessions
DELETE /api/v1/rbac/sessions/{session_id}           → Force logout
```

### 6.2 Updated Permission Check Flow (Endpoint Example)

```python
# BEFORE (current - manual filtering, hardcoded permissions)
@router.get("/campaigns/")
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_campaign_read)
):
    query = select(Campaign)
    if current_user.role != "super_admin":
        query = query.where(Campaign.organization_id == current_user.organization_id)
    result = await db.execute(query)
    return result.scalars().all()


# AFTER (new - centralized, clean endpoints)
@router.get("/campaigns/")
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(require_permission("campaign", "read"))
):
    # ctx.query_filter automatically contains org_id, brand_id, team_id filters
    query = select(Campaign).where(*ctx.query_filters(Campaign))
    result = await db.execute(query)
    return result.scalars().all()
```

---

## 7. Frontend Redesign

### 7.1 PermissionContext Architecture

```typescript
// frontend/src/contexts/PermissionContext.tsx

interface PermissionState {
    role: string;
    profileType: "agency" | "brand" | "creator";
    hierarchyLevel: number;
    effectivePermissions: Record<string, string[]>;  // {campaign: ["read", "create"], ...}
    customOverrides: PermissionOverride[];
    organizationId: number | null;
    brandId: number | null;
    teamId: number | null;
    loading: boolean;
}

// Usage in components:
const { can, canAny, canAll } = usePermission();
const canCreateCampaign = can("campaign", "create");
const canManageTeam = can("team", "admin");
```

### 7.2 PermissionGate Component

```typescript
// Usage:
<PermissionGate require="campaign:create" fallback={<UpgradePrompt />}>
    <CreateCampaignButton />
</PermissionGate>

// Multi-permission:
<PermissionGate requireAll={["campaign:create", "content:create"]}>
    <CampaignWizard />
</PermissionGate>

// Any-of:
<PermissionGate requireAny={["campaign:admin", "campaign:create"]}>
    <CampaignActions />
</PermissionGate>
```

### 7.3 Redesigned Access Control Panel

```
+──────────────────────────────────────────────────────────────+
│  Access Control                           [+ Custom Role]    │
+──────────────────────────────────────────────────────────────+
│                                                               │
│  ┌─ System Roles ──────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  [Super Admin]  Hierarchy: 100  │ 3 users │ [Edit ▶]   │ │
│  │  [Agency Admin] Hierarchy: 80   │ 8 users │ [Edit ▶]   │ │
│  │  [Brand Admin]  Hierarchy: 50   │ 12 users│ [Edit ▶]   │ │
│  │  [Creator]      Hierarchy: 20   │ 45 users│ [Edit ▶]   │ │
│  │  [Viewer]       Hierarchy: 10   │ 23 users│ [Edit ▶]   │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─ User: john@agency.com ──────────── agency_admin ───────┐ │
│  │                                                          │ │
│  │  Resource          Role Default    Override    Effective │ │
│  │  ─────────────────────────────────────────────────────── │ │
│  │  Campaign          ✅ admin        ─           ✅ admin  │ │
│  │  Content           ✅ admin        ─           ✅ admin  │ │
│  │  Design            ✅ admin        ─           ✅ admin  │ │
│  │  Analytics         ✅ admin        ─           ✅ admin  │ │
│  │  Billing           ❌ none         🟢 read     ✅ read   │ │
│  │  Admin Panel       ❌ none         ─           ❌ none   │ │
│  │  Social            ✅ admin        🔴 denied   ❌ denied │ │
│  │                                                          │ │
│  │  Legend: ─ = inherited from role                          │ │
│  │          🟢 = explicitly granted   🔴 = explicitly denied │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─ Audit Log ──────────────────────────────────────────────┐ │
│  │  2026-02-15 14:32  admin@co.com changed john's role       │ │
│  │                    viewer → agency_admin                   │ │
│  │  2026-02-15 14:33  admin@co.com granted billing:read      │ │
│  │                    to john@agency.com                      │ │
│  │  2026-02-15 14:35  admin@co.com denied social:*           │ │
│  │                    for john@agency.com                     │ │
│  └──────────────────────────────────────────────────────────┘ │
+──────────────────────────────────────────────────────────────+
```

---

## 8. Migration Strategy

### 8.1 Data Migration Plan

```
Step 1: Schema migration (add new columns, create new tables)
         ↓
Step 2: Seed Role.permissions_json from hardcoded role_permissions_map
         ↓
Step 3: Map existing user roles to new unified role names
         Old "admin" → "agency_admin"
         Old "manager" → "agency_member"
         Old "editor" → "brand_member"
         Old "viewer" → "viewer" (no change)
         ↓
Step 4: Migrate existing Permission records to new format
         Add scope_type/scope_id based on user's org
         ↓
Step 5: Set profile_type for existing users
         If user.organization_id exists → profile_type = "agency"
         If user is in creators table → profile_type = "creator"
         Default → "agency"
         ↓
Step 6: Dual-run period (old + new code paths)
         Log discrepancies between old and new permission decisions
         ↓
Step 7: Remove old hardcoded role_permissions_map
         Switch to DB-only evaluation
         ↓
Step 8: Clean up deprecated code
```

### 8.2 Backward Compatibility

| Aspect | Approach |
|--------|----------|
| Existing JWT tokens | Continue working (role field still in token). New permission resolution reads from DB |
| Frontend role checks | Old `hasPermission()` / `hasRole()` continue working during migration. New `usePermission()` hook runs alongside |
| API responses | No breaking changes. New fields added, none removed |
| Admin panel | Old toggle UI works. New redesigned panel deployed as separate route (`/admin/access-v2`) during testing |

---

## 9. Testing Plan

### 9.1 Test Scenarios

#### Permission Engine Tests (40+ cases)

| Category | Test Case | Expected |
|----------|-----------|----------|
| **Basic** | Super admin can access everything | ALLOW |
| **Basic** | Viewer can only read content | ALLOW read, DENY write |
| **Basic** | Unauthenticated request | 401 |
| **Hierarchy** | Agency admin assigns brand_member (lower) | ALLOW |
| **Hierarchy** | Agency admin assigns super_admin (higher) | DENY |
| **Hierarchy** | Brand admin assigns agency_admin (higher) | DENY |
| **Hierarchy** | Creator assigns any role | DENY |
| **Profile Type** | Creator user gets creator role | ALLOW |
| **Profile Type** | Creator user gets super_admin role | DENY |
| **Profile Type** | Agency user gets creator role | DENY |
| **Override** | User with explicit DENY on campaign:write | DENY (even if role allows) |
| **Override** | User with explicit ALLOW on billing:read | ALLOW (even if role denies) |
| **Override** | DENY overrides ALLOW on same resource | DENY wins |
| **Scope** | User with org-scoped campaign:read | ALLOW for own org, DENY for other |
| **Scope** | User with brand-scoped content:write | ALLOW for own brand, DENY for other brand in same org |
| **Scope** | User with team-scoped analytics:read | ALLOW for own team data |
| **Tenant** | User queries campaigns from other org | Empty result (filtered) |
| **Tenant** | User queries brands from other org | Empty result (filtered) |
| **Tenant** | Super admin queries cross-org | Returns all |
| **Audit** | Role assignment creates audit entry | Audit log record with before/after |
| **Audit** | Permission override creates audit entry | Audit log record |
| **Audit** | Access denial creates access log entry | Access log with denial reason |
| **Cache** | Permission check uses cached result | No DB query on second call |
| **Cache** | Permission change invalidates cache | Next request hits DB |
| **Security** | Expired JWT token | 401 |
| **Security** | Tampered JWT token | 401 |
| **Security** | Token from different secret key | 401 |
| **Security** | Role escalation attempt via API | 403 + audit log |

---

## 10. Summary

### Total Effort

| Phase | Description | Hours |
|-------|------------|-------|
| **R1** | Critical Security Fixes | 8 |
| **R2** | Permission Engine Core | 51 |
| **R3** | Role & Permission Management API | 28 |
| **R4** | Audit & Logging | 17 |
| **R5** | Frontend RBAC Redesign | 59 |
| **R6** | Advanced Features | 56 |
| **R7** | Testing | 38 |
| **TOTAL** | | **257 hours** |

### Implementation Priority Order

```
Week 1:     R1 (Security Fixes)         ← DO THIS FIRST, blocks production
Week 2-3:   R2 (Permission Engine Core) ← Foundation for everything else
Week 3-4:   R3 (Management API)         ← Enables admin workflows
Week 4:     R4 (Audit & Logging)        ← Required for compliance
Week 5-6:   R5 (Frontend Redesign)      ← New admin UI + PermissionGate
Week 7-8:   R6 (Advanced Features)      ← Cache, rate limiting, 2FA
Week 8-9:   R7 (Testing)               ← Run alongside each phase
```

### Gaps Resolved

| Gap | Fix Phase | Status |
|-----|-----------|--------|
| G-01 Hardcoded SECRET_KEY | R1-001 | Planned |
| G-02 Mock user bypass | R1-002, R1-003 | Planned |
| G-03 Hierarchy validation | R1-004 | Planned |
| G-04 Org-scoped assignment | R2-004, R1-004 | Planned |
| G-05 is_allowed field | R2-003 | Planned |
| G-06 Manual org filtering | R2-006, R2-008 | Planned |
| G-07 permissions_json unused | R2-002, R2-009 | Planned |
| G-08 Role set mismatch | R2-009, R5-001 | Planned |
| G-09 Permission language mismatch | R5-001, R3-008 | Planned |
| G-10 No resource-level perms | R6-006 | Planned |
| G-11 Team scoping undefined | R6-005 | Planned |
| G-12 No brand isolation | R6-004 | Planned |
| G-13 No audit log | R4-001 to R4-005 | Planned |
| G-14 No role CRUD | R3-001, R3-002 | Planned |
| G-15 Wrong UI defaults | R5-005 | Planned |
| G-16 No permission caching | R6-001 | Planned |
| G-17 No rate limiting | R6-002 | Planned |
| G-18 No invitation flow | R6-003 | Planned |
| G-19 profile_type not integrated | R2-005 | Planned |
| G-20 Duplicate functions | R1-005 | Planned |

### New Files

| Type | Count |
|------|-------|
| Backend Services | 3 (`permission_engine.py`, `security_alert_service.py`, `invitation_service.py`) |
| Backend Middleware | 3 (`tenant_filter.py`, `rate_limiter.py`, `ip_filter.py`) |
| Backend Models (extended) | 2 (`rbac.py` + new audit tables) |
| Backend Endpoints (rewritten) | 2 (`rbac.py`, `invitations.py`) |
| Backend Seeds | 1 (`seed_roles.py`) |
| Backend Decorators | 1 (`decorators.py`) |
| Backend Tests | 5 test files |
| Frontend Context | 1 (`PermissionContext.tsx`) |
| Frontend Components | 3 (`PermissionGate.tsx`, `BrandAccessPanel.tsx`, redesigned `AccessControlTab.tsx`) |
| Frontend Hooks | 1 (`usePermission.ts`) |
| Frontend Pages | 2 (`roles/page.tsx`, `audit/page.tsx`) |
| Frontend API | 1 (`rbac.ts`) |
| Migrations | 2 |
| **Total New/Modified** | **~27 files** |
