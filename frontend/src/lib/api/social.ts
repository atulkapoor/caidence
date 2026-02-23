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

export interface AdminSocialConnection {
    id: number;
    user_id: number;
    user_email: string | null;
    platform: string;
    platform_username: string | null;
    platform_display_name: string | null;
    is_active: boolean;
    connected_at: string | null;
    token_expires_at: string | null;
}

export interface SocialConnectionStatus {
    platform: string;
    connected: boolean;
    platform_username: string | null;
}

export interface LinkedInPublishPayload {
    text: string;
    visibility?: "PUBLIC" | "CONNECTIONS";
    image_data_url?: string;
    design_asset_id?: number;
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

export async function listConnectionsForSettings(): Promise<AdminSocialConnection[]> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/connections/admin`);
    if (!res.ok) throw new Error("Failed to fetch social connections");
    return res.json();
}

export async function disconnectPlatform(platform: string): Promise<void> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/disconnect/${platform}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Failed to disconnect ${platform}`);
}

export async function getConnectionStatus(platform: string): Promise<SocialConnectionStatus> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/status/${platform}`);
    if (!res.ok) throw new Error(`Failed to fetch ${platform} connection status`);
    return res.json();
}

export async function publishToLinkedIn(payload: LinkedInPublishPayload): Promise<{ post_id: string; status: string }> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/publish/linkedin`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to publish to LinkedIn");
    }
    return res.json();
}
