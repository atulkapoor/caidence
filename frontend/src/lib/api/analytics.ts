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
    try {
        const res = await fetch(`${API_BASE_URL}/analytics/dashboard`);
        if (!res.ok) throw new Error("Failed to fetch analytics dashboard");
        return res.json();
    } catch (error) {
        console.error("Analytics API failed, using mock data:", error);
        // Return mock data as fallback
        return {
            overview: {
                total_reach: 1250000,
                engagement_rate: 4.2,
                conversions: 892,
                roi: 3.8
            },
            traffic_data: [
                { name: "Jan", value: 4000 },
                { name: "Feb", value: 3500 },
                { name: "Mar", value: 5200 },
                { name: "Apr", value: 4800 },
                { name: "May", value: 6100 },
                { name: "Jun", value: 5400 },
                { name: "Jul", value: 7200 },
                { name: "Aug", value: 6800 },
                { name: "Sep", value: 8100 },
                { name: "Oct", value: 7500 },
                { name: "Nov", value: 9200 },
                { name: "Dec", value: 8800 }
            ],
            device_data: [
                { name: "Mobile", value: 52, color: "#6366f1" },
                { name: "Desktop", value: 35, color: "#22c55e" },
                { name: "Tablet", value: 13, color: "#f59e0b" }
            ]
        };
    }
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
