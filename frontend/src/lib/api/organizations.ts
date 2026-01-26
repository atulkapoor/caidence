import { API_BASE_URL } from "./core";

export interface OrganizationUser {
    id: number;
    email: string;
    full_name: string;
    role: string;
    organization_id: number;
    is_active: boolean;
}

export async function fetchOrganizationUsers(orgId: number): Promise<OrganizationUser[]> {
    const res = await fetch(`${API_BASE_URL}/organizations/${orgId}/users`);
    if (!res.ok) throw new Error("Failed to fetch organization users");
    return res.json();
}
