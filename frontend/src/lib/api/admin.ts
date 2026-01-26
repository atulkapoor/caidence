import { API_BASE_URL } from "./core";
import { getAuthHeaders } from "./core";

export interface AdminUser {
    id: number;
    email: string;
    full_name: string;
    role: string;
    organization_id: number | null;
    is_active: boolean;
    is_approved: boolean;
    created_at: string;
    permissions?: { module: string; access_level: string }[];
}

export interface TeamInvite {
    email: string;
    full_name: string;
    role: string;
    password: string;
    organization_id?: number;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/admin/users`, { headers });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}

export async function approveUser(userId: number): Promise<AdminUser> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ is_approved: true }),
    });
    if (!res.ok) throw new Error("Failed to approve user");
    return res.json();
}

export async function inviteUser(data: TeamInvite): Promise<AdminUser> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/admin/invite`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to invite user");
    }
    return res.json();
}
