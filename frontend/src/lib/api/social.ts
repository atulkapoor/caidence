import { API_BASE_URL, authenticatedFetch } from "./core";

export interface SocialConnection {
    id: number;
    platform: string;
    platform_username: string | null;
    platform_display_name: string | null;
    is_active: boolean;
    connected_at: string | null;
    follower_count: number | null;
    profile_picture_url: string | null;
}

export async function getConnectionUrl(platform: string): Promise<{ authorization_url: string; platform: string }> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/connect/${platform}`, { method: "POST" });
    if (!res.ok) throw new Error(`Failed to get auth URL for ${platform}`);
    return res.json();
}

export async function listConnections(): Promise<SocialConnection[]> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/connections`);
    if (!res.ok) throw new Error("Failed to fetch social connections");
    return res.json();
}

export async function disconnectPlatform(platform: string): Promise<void> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/disconnect/${platform}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Failed to disconnect ${platform}`);
}
