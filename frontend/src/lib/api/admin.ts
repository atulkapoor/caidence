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
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_approved: true }),
    });
    if (!res.ok) throw new Error("Failed to approve user");
    return res.json();
}

export async function inviteUser(data: TeamInvite): Promise<AdminUser> {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/invite`, {
        method: "POST",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to invite user");
    }
    return res.json();
}
