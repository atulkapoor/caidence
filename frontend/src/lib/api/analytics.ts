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
