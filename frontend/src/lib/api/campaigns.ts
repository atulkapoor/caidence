import { API_BASE_URL } from "./core";

export interface Campaign {
    id: number;
    title: string;
    description?: string;
    status: string;
    progress?: number;
    budget?: string;
    spent?: string;
    start_date?: string;
    end_date?: string;
    channels?: string; // JSON string
    audience_targeting?: string; // JSON string
}

export async function fetchCampaigns(): Promise<Campaign[]> {
    const res = await fetch(`${API_BASE_URL}/campaigns/`);
    if (!res.ok) throw new Error("Failed to fetch campaigns");
    return res.json();
}

export async function createCampaign(data: {
    title: string;
    description?: string;
    status?: string;
    budget?: string;
    start_date?: string;
    end_date?: string;
    channels?: string;
    audience_targeting?: string;
}): Promise<Campaign> {
    const res = await fetch(`${API_BASE_URL}/campaigns/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create campaign");
    return res.json();
}

export async function updateCampaign(id: number, data: Partial<Campaign>): Promise<Campaign> {
    const res = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update campaign");
    return res.json();
}

export async function addInfluencerToCampaign(campaignId: number, handle: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/influencers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
    });
    // Mock success for now if 404 (since backed might not implement this specific route yet)
    if (res.status === 404) {
        console.warn("Mocking successful influencer addition (Backend endpoint missing)");
        return { success: true, mock: true };
    }
    if (!res.ok) throw new Error("Failed to add influencer to campaign");
    return res.json();
}
