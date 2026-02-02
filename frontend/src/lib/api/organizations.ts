import { API_BASE_URL, getAuthHeaders } from "./core";

export interface OrganizationUser {
    id: number;
    email: string;
    full_name: string;
    role: string;
    organization_id: number;
    is_active: boolean;
}


export interface Organization {
    id: number;
    name: string;
    plan_tier: string;
    user_count: number;
    is_active: boolean;
}

export async function fetchOrganizationUsers(orgId: number): Promise<OrganizationUser[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/users`, { headers });
    if (!res.ok) throw new Error("Failed to fetch organization users");
    return res.json();
}

export async function fetchOrganizations(): Promise<Organization[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/organizations`, { headers });
    if (!res.ok) throw new Error("Failed to fetch organizations");
    return res.json();
}
