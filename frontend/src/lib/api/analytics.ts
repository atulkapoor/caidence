import { API_BASE_URL } from "./core";

export interface AnalyticsOverview {
    total_reach: number;
    engagement_rate: number;
    conversions: number;
    roi: number;
}

export interface AnalyticsDashboardResponse {
    overview: AnalyticsOverview;
    traffic_data: Array<{ name: string; value: number }>;
    device_data: Array<{ name: string; value: number; color: string }>;
}

export async function getDashboardAnalytics(): Promise<AnalyticsDashboardResponse> {
    const res = await fetch(`${API_BASE_URL}/analytics/dashboard`);
    if (!res.ok) throw new Error("Failed to fetch analytics dashboard");
    return res.json();
}

export interface CompetitorAnalysisResponse {
    breakdown: Array<{
        name: string;
        share_of_voice: number;
        sentiment: string;
        top_hashtags: string[];
        recent_activity: string;
    }>;
}

export async function fetchCompetitorAnalysis(competitors: string[]): Promise<CompetitorAnalysisResponse> {
    // Phase 1: No Auth required for demo analytics
    const res = await fetch(`${API_BASE_URL}/analytics/competitor-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors })
    });
    if (!res.ok) throw new Error("Failed to fetch competitor analysis");
    return res.json();
}
