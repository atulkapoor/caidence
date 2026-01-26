import { API_BASE_URL } from "./core";

export interface CampaignDraft {
    title: string;
    description: string;
    budget: string;
    channels: string[];
    agent_logs?: string[];
    alternative_draft?: CampaignDraft;
}

export async function generateCampaignPlan(goal: string, product: string, audience: string): Promise<CampaignDraft> {
    const res = await fetch(`${API_BASE_URL}/agent/draft_campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, product, audience }),
    });
    if (!res.ok) throw new Error("Failed to generate campaign details");
    return res.json();
}
