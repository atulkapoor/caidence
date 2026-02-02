import { API_BASE_URL, getAuthHeaders } from "./core";

export interface CampaignHistory {
    campaign_name: string;
    date: string;
    roi_multiple: number;
    status: string;
}

export interface RelationshipProfile {
    handle: string;
    platform: string;
    avatar_color: string;
    relationship_status: "Active" | "Vetted" | "Past" | "Blacklisted";
    total_spend: number;
    avg_roi: number;
    last_contact: string;
    campaign_history: CampaignHistory[];
}

export async function fetchRelationships(): Promise<RelationshipProfile[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/relationships`, { headers });
    if (!res.ok) throw new Error("Failed to fetch relationships");
    return res.json();
}

export async function generateXRayReport(handle: string): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/generate-report?handle=${handle}`, {
        method: "POST",
        headers
    });
    if (!res.ok) throw new Error("Failed to generate report");
    return res.json();
}
