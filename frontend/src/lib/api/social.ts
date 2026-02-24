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

export interface PublishPostResponse {
    platform: string;
    status: string;
    post_id?: string;
    target_name: string;
    published: boolean;
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
    const text = (payload.text || "").trim();
    if (!text) {
        throw new Error("LinkedIn post text is required");
    }

    const res = await authenticatedFetch(`${API_BASE_URL}/social/publish/linkedin`, {
        method: "POST",
        body: JSON.stringify({ ...payload, text }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to publish to LinkedIn");
    }
    return res.json();
}

export async function publishSocialPost(
    platform: string,
    message: string,
    image_url?: string,
    content_id?: number,
): Promise<PublishPostResponse> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/publish/${platform}`, {
        method: "POST",
        body: JSON.stringify({ message, image_url, content_id }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to publish to ${platform}`);
    }
    const raw = await res.text();
    let data: Record<string, unknown> = {};
    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch {
            data = {};
        }
    }
    const normalizedPlatform = String(data.platform || platform).toLowerCase();
    const status = String(data.status || "published");
    const published = typeof data.published === "boolean"
        ? data.published
        : ["published", "posted", "success", "ok"].includes(status.toLowerCase());

    return {
        platform: normalizedPlatform,
        status,
        post_id: data.post_id ? String(data.post_id) : undefined,
        target_name: String(data.target_name || platform),
        published,
    };
}
