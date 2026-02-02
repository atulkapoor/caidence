import { API_BASE_URL, getAuthHeaders } from "./core";

export interface Creator {
    id: number;
    handle: string;
    platform: string;
    name: string;
    category: string;
    tier: string;
    follower_count: number;
    engagement_rate: number;
    status: string;
    affiliate_code?: string;
}

export async function fetchCreators(): Promise<Creator[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/creators`, { headers });
    if (!res.ok) throw new Error("Failed to fetch creators");
    return res.json();
}

export async function addCreator(handle: string): Promise<Creator> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/creators`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
    });
    if (!res.ok) throw new Error("Failed to add creator");
    return res.json();
}

export async function generateAffiliateCode(creatorId: number): Promise<{ code: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/creators/${creatorId}/affiliate`, {
        method: "POST",
        headers
    });
    if (!res.ok) throw new Error("Failed to generate affiliate code");
    return res.json();
}
