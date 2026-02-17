# C(AI)DENCE Admin Guide

This guide covers the Admin Panel and the responsibilities of platform and organization administrators.

---

## 1. Accessing the Admin Panel

**Route:** `/admin`

The Admin Panel is gated by the `admin:read` permission. Users without this permission will see an "Access Denied" screen rendered by the `AccessDenied` component. In practice, only users with the `super_admin` or `root` role have `admin:read` granted by default.

The panel renders seven tabs: **Overview**, **Users**, **Access Control**, **Roles**, **Audit Log**, **Organizations**, and **Billing**.

---

## 2. User Management

**Tab:** Users

The Users tab displays a searchable list of all platform users. Each row shows the user's email, full name, role, organization assignment, and approval status. From this view, administrators can:

- **Approve or reject pending users** — new registrations require approval before the account becomes active. The `is_approved` flag on the user record is toggled via `PUT /api/v1/admin/users/{user_id}`.
- **Invite new users** — the invite flow creates a new user record with a specified email, full name, role, and organization via `POST /api/v1/admin/invite`. A password is set at invite time.
- **Update role or status** — any user's `role`, `is_active`, `is_approved`, or `organization_id` can be patched from the detail view.

The backend enforces that an admin cannot elevate a user to a role at or above their own hierarchy level.

---

## 3. Access Control

**Tab:** Access Control

The Access Control tab (rendered by `AccessControlTab.tsx`) provides per-user permission overrides. Selecting a user expands a panel listing all 15 controllable modules:

| Module Key | Label |
|---|---|
| `agency` | Agency Hub |
| `creators` | Creator Roster |
| `ai_agent` | AI Agent |
| `ai_chat` | AI Chat |
| `workflow` | Workflow Builder |
| `content_studio` | Content Studio |
| `design_studio` | Design Studio |
| `presentation_studio` | Presentation Studio |
| `marcom` | Marcom Hub |
| `crm` | CRM |
| `campaign` | Campaign Planner |
| `discovery` | Discovery Engine |
| `analytics` | Analytics |
| `content` | Content |
| `admin` | Admin Panel |

For each module, the permission state can be set to **Inherited** (uses role default), **Granted** (explicit allow override), or **Denied** (explicit deny override). Overrides are stored as `Permission` records linked to the user and are evaluated by the `PermissionEngine` before role defaults.

The RBAC API endpoints that power this tab are:

- `GET /api/v1/rbac/users/{user_id}/permissions` — fetch effective permissions and existing overrides
- `POST /api/v1/rbac/overrides` — create a new override
- `PUT /api/v1/rbac/overrides/{override_id}` — update an existing override
- `DELETE /api/v1/rbac/overrides/{override_id}` — remove an override (revert to inherited)

---

## 4. Role Management

**Tab:** Roles

The Roles tab (rendered by `RoleManagementTab.tsx`) displays all roles ordered by hierarchy level. For each role, admins can view and edit the `permissions_json` — the map of `resource → [actions]` that defines what the role can do by default.

Key constraints enforced by the backend:

- Built-in roles (`root`, `super_admin`, `agency_admin`, `agency_member`, `brand_admin`, `brand_member`, `creator`, `viewer`) cannot be deleted.
- The `root` and `super_admin` role names cannot be modified by anyone below `root`.
- Only `read` and `write` are valid action values. Any other value will be rejected with a `422` error.
- A role cannot be created or modified to sit at or above the acting admin's own hierarchy level (unless the actor is `root`).

Custom roles can be created via `POST /api/v1/rbac/roles` and deleted (if no users are assigned) via `DELETE /api/v1/rbac/roles/{role_id}`.

---

## 5. Audit Log

**Tab:** Audit Log

The Audit Log tab (rendered by `AuditLogTab.tsx`) provides a full history of permission-related administrative actions. Each entry records:

- **Actor** — the admin who performed the action (email)
- **Action** — the event type (e.g., `role_created`, `role_updated`, `role_deleted`, `role_permissions_updated`, `role_assigned`, `override_created`, `override_deleted`)
- **Target user** — the affected user (where applicable)
- **Details** — a JSON blob with old and new values
- **Timestamp** — when the action occurred

Audit log entries are written by the `_log_audit` helper in `backend/app/api/endpoints/rbac.py` and stored in the `AuditLog` model. The frontend supports filtering by action type and target email.

---

## 6. Organization Management

**Tab:** Organizations

The Organizations tab allows super admins to view all organizations registered on the platform. From this view, admins can:

- See each organization's name, plan tier, and number of associated users and brands.
- Link or unlink users from organizations by updating `organization_id` on the user record.
- Inspect brand-level data nested under each organization.

The backend exposes organization data through `GET /api/v1/admin/organizations` and related endpoints in `backend/app/api/endpoints/admin.py`. The platform overview stats (total organizations, total users, total brands, pending approvals) are loaded from `GET /api/v1/admin/overview`.

---

## 7. Role Hierarchy

C(AI)DENCE uses an 8-level role hierarchy. Higher numerical levels grant broader access and the ability to manage users at lower levels. Super admins (level 100 and above) bypass all tenant and scope filters.

| Role | Hierarchy Level | Description |
|---|---|---|
| `root` | 110 | Full platform access. Can modify all built-in roles and all users. |
| `super_admin` | 100 | Platform administration. Can manage all organizations, approve users, assign roles below their level. |
| `agency_admin` | 80 | Manages a single agency organization, its brands, and its team members. |
| `agency_member` | 60 | Member of an agency organization. Access scoped to organization data. |
| `brand_admin` | 50 | Manages a single brand. Can manage brand-level creators and campaigns. |
| `brand_member` | 40 | Member of a brand team. Read and limited write access to brand resources. |
| `creator` | 20 | Creator self-service access via the Creator Portal. |
| `viewer` | 10 | Read-only access to permitted resources. |

The hierarchy levels used in `frontend/src/lib/permissions.ts` and `backend/app/services/auth_service.py` must remain in sync. Any role assignment or custom role creation is validated against these levels to prevent privilege escalation.

### Permission Resolution Order

The `PermissionEngine` (`backend/app/services/permission_engine.py`) evaluates access in the following order:

1. Super Admin / Root → **ALLOW** (bypass all checks)
2. Explicit DENY override (`is_allowed=False`) → **DENY**
3. Explicit ALLOW override (`is_allowed=True`) → **ALLOW**
4. Role default from `Role.permissions_json` → **ALLOW or DENY**
5. Default → **DENY**

Scope cascade applies from widest to narrowest: Global > Organization > Brand > Team.
