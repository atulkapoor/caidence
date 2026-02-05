import { API_BASE_URL, authenticatedFetch } from "./core";

export interface AnalyticsOverview {
    total_reach: number;
    engagement_rate: number;
    conversions: number;
    roi: number;
}

export interface AnalyticsDashboardResponse {
    overview: AnalyticsOverview;
    trends: Array<{ date: string; value: number; engagement: number }>;
    audience: Array<{ name: string; value: number }>;
}

export async function getDashboardAnalytics(): Promise<AnalyticsDashboardResponse> {
    try {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : null;
        
        if (!token) {
            console.warn("No auth token found, using mock data");
            return getMockAnalyticsData();
        }

        const res = await authenticatedFetch(`${API_BASE_URL}/analytics/dashboard`);
        
        if (!res.ok) {
            console.warn(`Analytics API returned ${res.status}, using mock data`, await res.text());
            return getMockAnalyticsData();
        }
        
        const data = await res.json();
        console.log("Analytics data loaded successfully:", data);
        return data;
    } catch (error) {
        console.error("Analytics API error, using mock data:", error);
        return getMockAnalyticsData();
    }
}

function getMockAnalyticsData(): AnalyticsDashboardResponse {
    return {
        overview: {
            total_reach: 1250000,
            engagement_rate: 4.2,
            conversions: 892,
            roi: 3.8
        },
        trends: [
            { date: "Jan", value: 4000, engagement: 2400 },
            { date: "Feb", value: 3500, engagement: 1398 },
            { date: "Mar", value: 5200, engagement: 9800 },
            { date: "Apr", value: 4800, engagement: 3908 },
            { date: "May", value: 6100, engagement: 4800 },
            { date: "Jun", value: 5400, engagement: 3800 },
            { date: "Jul", value: 7200, engagement: 4300 }
        ],
        audience: [
            { name: "Mobile", value: 52 },
            { name: "Desktop", value: 35 },
            { name: "Tablet", value: 13 }
        ]
    };
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
    const res = await authenticatedFetch(`${API_BASE_URL}/analytics/competitor-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors })
    });
    if (!res.ok) throw new Error("Failed to fetch competitor analysis");
    return res.json();
}

// Audience Overlap Types and Function
export interface AudienceOverlapResponse {
    overlap_percentage: number;
    total_reach: number;
    unique_reach: number;
    channel_breakdown: Array<{
        channel: string;
        reach: number;
        color: string;
    }>;
}

export async function fetchAudienceOverlap(channels: string[]): Promise<AudienceOverlapResponse> {
    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/analytics/audience-overlap`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channels })
        });
        if (!res.ok) throw new Error("Failed to fetch audience overlap");
        return res.json();
    } catch (error) {
        console.error("Audience overlap API failed, using mock data:", error);
        // Return mock data as fallback
        const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];
        return {
            overlap_percentage: 23,
            total_reach: 2500000,
            unique_reach: 1925000,
            channel_breakdown: channels.map((ch, i) => ({
                channel: ch,
                reach: Math.floor(Math.random() * 500000) + 200000,
                color: colors[i % colors.length]
            }))
        };
    }
}

// Campaign Analytics Types and Function
export interface CampaignAnalytics {
    total_campaigns: number;
    active_campaigns: number;
    total_spend: number;
    total_impressions: number;
    avg_engagement_rate: number;
    // Extended fields for AnalyticsTab
    overview?: {
        total_spend: string;
        roi: string;
        conversions: string;
        ctr: string;
    };
    performance_chart?: Array<{ name: string; value: number }>;
    channel_distribution?: Array<{ name: string; value: number }>;
}

export async function fetchCampaignAnalytics(): Promise<CampaignAnalytics> {
    try {
        const res = await authenticatedFetch(`${API_BASE_URL}/analytics/campaigns`);
        if (!res.ok) throw new Error("Failed to fetch campaign analytics");
        return res.json();
    } catch (error) {
        console.error("Campaign analytics API failed, using mock data:", error);
        // Return mock data as fallback
        return {
            total_campaigns: 12,
            active_campaigns: 5,
            total_spend: 45000,
            total_impressions: 2850000,
            avg_engagement_rate: 4.2,
            overview: {
                total_spend: "$45,231",
                roi: "3.2x",
                conversions: "1,234",
                ctr: "2.1%"
            },
            performance_chart: [
                { name: "Mon", value: 4000 },
                { name: "Tue", value: 3000 },
                { name: "Wed", value: 2000 },
                { name: "Thu", value: 2780 },
                { name: "Fri", value: 1890 },
                { name: "Sat", value: 2390 },
                { name: "Sun", value: 3490 }
            ],
            channel_distribution: [
                { name: "Instagram", value: 45 },
                { name: "TikTok", value: 30 },
                { name: "YouTube", value: 15 },
                { name: "Other", value: 10 }
            ]
        };
    }
}
