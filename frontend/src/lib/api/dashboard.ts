import { API_BASE_URL } from "./core";

export interface DashboardStats {
    active_campaigns: number;
    active_campaigns_growth: number;
    ai_workflows: number;
    content_generated: number;
    ai_conversations: number;
}

export interface ActivityLog {
    id: number;
    action: string;
    details: string;
    timestamp: string;
    user_id?: number;
}

export interface CampaignSummary {
    title: string;
    status: "active" | "paused" | "completed";
    description: string;
    progress: number;
    budget: string;
    channels: number;
}

export interface PerformanceMetric {
    name: string;
    campaigns: number;
    engagement: number;
}

export interface DashboardData {
    stats: DashboardStats;
    activities: ActivityLog[];
    performance: PerformanceMetric[];
    featuredCampaign: CampaignSummary | null;
}

export async function fetchDashboardStats(range: string = "6m"): Promise<DashboardData> {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats?range=${range}`);
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return res.json();
}

// Deprecated individual fetchers if we are moving to consolidated
export async function fetchActivities(): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE_URL}/dashboard/activities`);
    if (!res.ok) throw new Error("Failed to fetch activities");
    return res.json();
}
