import { API_BASE_URL, authenticatedFetch } from "./core";

export interface AdminUser {
    id: number;
    email: string;
    full_name: string;
    role: string;
    organization_id: number | null;
    is_active: boolean;
    is_approved: boolean;
    created_at: string;
    custom_permissions?: { resource: string; action: string; scope_type?: string }[];
}

export interface TeamInvite {
    email: string;
    full_name: string;
    role: string;
    password: string;
    organization_id?: number;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/users`);
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}

export async function approveUser(userId: number): Promise<AdminUser> {
    return updateAdminUser(userId, { is_approved: true });
}

export async function updateAdminUser(
    userId: number,
    payload: Partial<Pick<AdminUser, "role" | "organization_id" | "is_active" | "is_approved">>
): Promise<AdminUser> {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update user");
    return res.json();
}

export async function inviteUser(data: TeamInvite): Promise<AdminUser> {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/invite`, {
        method: "POST",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to invite user");
    }
    return res.json();
}

export interface PlatformOverview {
    total_organizations: number;
    total_users: number;
    total_brands: number;
    pending_approvals: number;
    mrr: number;
    active_subscriptions: number;
}

export interface AdminOrg {
    id: number;
    name: string;
    plan_tier: string;
    user_count: number;
    is_active: boolean;
}

export async function fetchPlatformOverview(): Promise<PlatformOverview> {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/overview`);
    if (!res.ok) throw new Error("Failed to fetch platform overview");
    return res.json();
}

export async function fetchAdminOrganizations(): Promise<AdminOrg[]> {
    const res = await authenticatedFetch(`${API_BASE_URL}/organizations`);
    if (!res.ok) throw new Error("Failed to fetch organizations");
    return res.json();
}
