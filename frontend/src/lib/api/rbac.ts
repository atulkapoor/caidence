import { API_BASE_URL, authenticatedFetch } from "./core";

const RBAC_URL = `${API_BASE_URL}/rbac`;

// ========== Types ==========

export interface EffectivePermissions {
    user_id: number;
    role: string;
    organization_id: number | null;
    team_id: number | null;
    permissions: string[];
    is_super_admin: boolean;
}

export interface RoleData {
    id: number;
    name: string;
    display_name: string | null;
    description: string | null;
    hierarchy_level: number;
    permissions_json: Record<string, string[]>;
    created_at: string;
}

export interface PermissionOverride {
    id: number;
    user_id: number;
    resource: string;
    action: string;
    scope_type: string;
    scope_id: number | null;
    is_allowed: boolean;
    created_at: string;
}

export interface AuditLogEntry {
    id: number;
    actor_id: number;
    actor_email: string;
    action: string;
    target_user_id: number | null;
    target_user_email: string | null;
    details: Record<string, unknown>;
    created_at: string;
}

export interface PermissionCheckResult {
    allowed: boolean;
    resource: string;
    action: string;
    reason: string;
}

export interface BulkPermissionResult {
    updated: number;
    created: number;
    errors: string[];
}

// ========== My Permissions ==========

export async function getMyPermissions(): Promise<EffectivePermissions> {
    const res = await authenticatedFetch(`${RBAC_URL}/permissions/me`);
    if (!res.ok) throw new Error("Failed to fetch permissions");
    return res.json();
}

// ========== Roles ==========

export async function listRoles(): Promise<RoleData[]> {
    const res = await authenticatedFetch(`${RBAC_URL}/roles`);
    if (!res.ok) throw new Error("Failed to list roles");
    return res.json();
}

export async function createRole(data: {
    name: string;
    display_name?: string;
    description?: string;
    hierarchy_level?: number;
    permissions_json?: Record<string, string[]>;
}): Promise<RoleData> {
    const res = await authenticatedFetch(`${RBAC_URL}/roles`, {
        method: "POST",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create role");
    }
    return res.json();
}

export async function updateRole(
    roleId: number,
    data: Partial<Pick<RoleData, "display_name" | "description" | "hierarchy_level" | "permissions_json">>
): Promise<RoleData> {
    const res = await authenticatedFetch(`${RBAC_URL}/roles/${roleId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update role");
    }
    return res.json();
}

export async function deleteRole(roleId: number): Promise<void> {
    const res = await authenticatedFetch(`${RBAC_URL}/roles/${roleId}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to delete role");
    }
}

export async function updateRolePermissions(
    roleId: number,
    permissions_json: Record<string, string[]>
): Promise<RoleData> {
    const res = await authenticatedFetch(`${RBAC_URL}/roles/${roleId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions_json }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update role permissions");
    }
    return res.json();
}

// ========== Role Assignment ==========

export async function assignRole(data: {
    user_id: number;
    role_name: string;
    scope_type?: string;
    scope_id?: number;
}): Promise<{ message: string }> {
    const res = await authenticatedFetch(`${RBAC_URL}/assign`, {
        method: "POST",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to assign role");
    }
    return res.json();
}

// ========== User Permissions ==========

export async function getUserPermissions(userId: number): Promise<EffectivePermissions> {
    const res = await authenticatedFetch(`${RBAC_URL}/users/${userId}/permissions`);
    if (!res.ok) throw new Error("Failed to fetch user permissions");
    return res.json();
}

// ========== Permission Overrides ==========

export async function listUserOverrides(userId: number): Promise<PermissionOverride[]> {
    const res = await authenticatedFetch(`${RBAC_URL}/overrides/${userId}`);
    if (!res.ok) throw new Error("Failed to list overrides");
    return res.json();
}

export async function createOverride(data: {
    user_id: number;
    resource: string;
    action: string;
    scope_type?: string;
    scope_id?: number;
    is_allowed?: boolean;
}): Promise<PermissionOverride> {
    const res = await authenticatedFetch(`${RBAC_URL}/overrides`, {
        method: "POST",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create override");
    }
    return res.json();
}

export async function updateOverride(
    overrideId: number,
    data: { action?: string; is_allowed?: boolean }
): Promise<PermissionOverride> {
    const res = await authenticatedFetch(`${RBAC_URL}/overrides/${overrideId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update override");
    }
    return res.json();
}

export async function deleteOverride(overrideId: number): Promise<void> {
    const res = await authenticatedFetch(`${RBAC_URL}/overrides/${overrideId}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to delete override");
    }
}

export async function bulkUpdatePermissions(
    permissions: { user_id: number; resource: string; action: string; is_allowed?: boolean }[]
): Promise<BulkPermissionResult> {
    const res = await authenticatedFetch(`${RBAC_URL}/overrides/bulk`, {
        method: "POST",
        body: JSON.stringify({ permissions }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to bulk update");
    }
    return res.json();
}

// ========== Permission Check ==========

export async function checkPermission(
    resource: string,
    action: string
): Promise<PermissionCheckResult> {
    const res = await authenticatedFetch(`${RBAC_URL}/check`, {
        method: "POST",
        body: JSON.stringify({ resource, action }),
    });
    if (!res.ok) throw new Error("Failed to check permission");
    return res.json();
}

// ========== Audit Log ==========

export async function getAuditLog(params?: {
    limit?: number;
    offset?: number;
    action_filter?: string;
    target_user_id?: number;
}): Promise<AuditLogEntry[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));
    if (params?.action_filter) searchParams.set("action_filter", params.action_filter);
    if (params?.target_user_id) searchParams.set("target_user_id", String(params.target_user_id));

    const url = searchParams.toString()
        ? `${RBAC_URL}/audit-log?${searchParams}`
        : `${RBAC_URL}/audit-log`;

    const res = await authenticatedFetch(url);
    if (!res.ok) throw new Error("Failed to fetch audit log");
    return res.json();
}
