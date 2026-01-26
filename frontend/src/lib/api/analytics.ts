import { API_BASE_URL } from "./core";

export interface AudienceOverlapResponse {
    total_reach: number;
    unique_reach: number;
    overlap_percentage: number;
    channel_breakdown: {
        channel: string;
        reach: number;
        color: string;
    }[];
    message: string;
}

export async function fetchAudienceOverlap(channels: string[]): Promise<AudienceOverlapResponse> {
    const res = await fetch(`${API_BASE_URL}/analytics/audience-overlap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels }),
    });
    if (!res.ok) throw new Error("Failed to fetch overlap data");
    return res.json();
}

export interface CompetitorAnalysisResponse {
    breakdown: {
        name: string;
        share_of_voice: number;
        sentiment: string;
        top_hashtags: string[];
        recent_activity: string;
    }[];
}

export async function fetchCompetitorAnalysis(competitors: string[]): Promise<CompetitorAnalysisResponse> {
    const res = await fetch(`${API_BASE_URL}/analytics/competitor-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors }),
    });
    if (!res.ok) throw new Error("Failed to fetch competitor analysis");
    return res.json();
}


export interface CampaignAnalytics {
    overview: {
        total_spend: string;
        roi: string;
        conversions: string;
        ctr: string;
    };
    performance_chart: {
        name: string;
        value: number;
    }[];
    channel_distribution: {
        name: string;
        value: number;
    }[];
}

export async function fetchCampaignAnalytics(): Promise<CampaignAnalytics> {
    const res = await fetch(`${API_BASE_URL}/campaigns/analytics/stats`);
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
}
