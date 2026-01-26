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

export async function fetchDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
}

export async function fetchActivities(): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE_URL}/dashboard/activities`);
    if (!res.ok) throw new Error("Failed to fetch activities");
    return res.json();
}
