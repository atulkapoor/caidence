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
    brand_id?: number | null;
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
    brand_id?: number | null;
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
    content_id?: number;
    brand_id?: number;
}

export interface PublishPostResponse {
    platform: string;
    status: string;
    post_id?: string;
    target_name: string;
    published: boolean;
}

export interface WhatsAppTemplatePayload {
    name: string;
    language: { code: string };
    components?: Array<Record<string, unknown>>;
}

export interface WhatsAppPublishPayload {
    to_numbers: string[];
    message?: string;
    image_url?: string;
    image_data_url?: string;
    design_asset_id?: number;
    content_id?: number;
    template?: WhatsAppTemplatePayload;
    brand_id?: number;
}

export interface WhatsAppPublishResult {
    platform: string;
    status: string;
    phone_number_id?: string;
    display_phone_number?: string;
    verified_name?: string;
    results: Array<{
        to: string;
        status: string;
        message_id?: string;
        error?: string;
    }>;
}

export interface SchedulePostPayload {
    platform: string;
    message: string;
    scheduled_at: string;
    title?: string;
    image_url?: string;
    to_numbers?: string[];
    content_id?: number;
    design_asset_id?: number;
    campaign_id?: number;
    brand_id?: number;
}

export interface ScheduledPost {
    id: number;
    user_id: number;
    content_id?: number | null;
    design_asset_id?: number | null;
    campaign_id?: number | null;
    title?: string | null;
    platform: string;
    message: string;
    image_url?: string | null;
    to_numbers?: string[] | null;
    status: string;
    scheduled_at: string;
    published_at?: string | null;
    post_id?: string | null;
    target_name?: string | null;
    error_message?: string | null;
    created_at: string;
    updated_at?: string | null;
}

export interface ScheduledPostSummary {
    id: number;
    user_id: number;
    content_id?: number | null;
    design_asset_id?: number | null;
    campaign_id?: number | null;
    title?: string | null;
    platform: string;
    status: string;
    scheduled_at: string;
    published_at?: string | null;
    created_at: string;
    updated_at?: string | null;
}

export async function getConnectionUrl(
    platform: string,
    redirectTo?: string,
    brandId?: number | null,
): Promise<{ authorization_url: string; platform: string }> {
    const query = new URLSearchParams();
    if (redirectTo) query.set("redirect_to", redirectTo);
    if (typeof brandId === "number") query.set("brand_id", String(brandId));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const res = await authenticatedFetch(`${API_BASE_URL}/social/connect/${platform}${suffix}`, { method: "POST" });
    if (!res.ok) throw new Error(`Failed to get auth URL for ${platform}`);
    return res.json();
}

export async function listConnections(brandId?: number | null): Promise<SocialConnection[]> {
    const suffix = typeof brandId === "number" ? `?brand_id=${brandId}` : "";
    const res = await authenticatedFetch(`${API_BASE_URL}/social/connections${suffix}`);
    if (!res.ok) throw new Error("Failed to fetch social connections");
    return res.json();
}

export async function listConnectionsForSettings(): Promise<AdminSocialConnection[]> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/connections/admin`);
    if (!res.ok) throw new Error("Failed to fetch social connections");
    return res.json();
}

export async function disconnectPlatform(platform: string, brandId?: number | null): Promise<void> {
    const suffix = typeof brandId === "number" ? `?brand_id=${brandId}` : "";
    const res = await authenticatedFetch(`${API_BASE_URL}/social/disconnect/${platform}${suffix}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Failed to disconnect ${platform}`);
}

export async function getConnectionStatus(platform: string, brandId?: number | null): Promise<SocialConnectionStatus> {
    const suffix = typeof brandId === "number" ? `?brand_id=${brandId}` : "";
    const res = await authenticatedFetch(`${API_BASE_URL}/social/status/${platform}${suffix}`);
    if (!res.ok) throw new Error(`Failed to fetch ${platform} connection status`);
    return res.json();
}

export async function publishToLinkedIn(payload: LinkedInPublishPayload): Promise<PublishPostResponse> {
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
    const data = await res.json();
    const normalizedPlatform = String(data.platform || "linkedin").toLowerCase();
    const status = String(data.status || "published");
    const published = typeof data.published === "boolean"
        ? data.published
        : ["published", "posted", "success", "ok"].includes(status.toLowerCase());

    return {
        platform: normalizedPlatform,
        status,
        post_id: data.post_id ? String(data.post_id) : undefined,
        target_name: String(data.target_name || "LinkedIn"),
        published,
    };
}

export async function publishToWhatsApp(payload: WhatsAppPublishPayload): Promise<WhatsAppPublishResult> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/publish/whatsapp`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to send WhatsApp message");
    }
    return res.json();
}

export async function publishSocialPost(
    platform: string,
    message: string,
    image_url?: string,
    content_id?: number,
    design_asset_id?: number,
    brand_id?: number,
): Promise<PublishPostResponse> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/publish/${platform}`, {
        method: "POST",
        body: JSON.stringify({ message, image_url, content_id, design_asset_id, brand_id }),
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

export async function scheduleSocialPost(payload: SchedulePostPayload): Promise<ScheduledPost> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/scheduled-posts`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to schedule post");
    }
    return res.json();
}

export async function fetchScheduledPosts(params?: {
    status?: string;
    from_date?: string;
    to_date?: string;
}): Promise<ScheduledPost[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.from_date) query.set("from_date", params.from_date);
    if (params?.to_date) query.set("to_date", params.to_date);
    const suffix = query.toString() ? `?${query.toString()}` : "";

    const res = await authenticatedFetch(`${API_BASE_URL}/social/scheduled-posts${suffix}`);
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to fetch scheduled posts");
    }
    return res.json();
}

export async function fetchScheduledPostsSummary(params?: {
    status?: string;
    from_date?: string;
    to_date?: string;
}): Promise<ScheduledPostSummary[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.from_date) query.set("from_date", params.from_date);
    if (params?.to_date) query.set("to_date", params.to_date);
    const suffix = query.toString() ? `?${query.toString()}` : "";

    const res = await authenticatedFetch(`${API_BASE_URL}/social/scheduled-posts/summary${suffix}`);
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to fetch scheduled posts summary");
    }
    return res.json();
}

export async function fetchScheduledPostById(scheduledPostId: number): Promise<ScheduledPost> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/scheduled-posts/${scheduledPostId}`);
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to fetch scheduled post details");
    }
    return res.json();
}

export async function cancelScheduledPost(scheduledPostId: number): Promise<ScheduledPost> {
    // Try multiple endpoint shapes for backward compatibility across deployments/proxies.
    const attempts: Array<{ url: string; method: "POST" | "DELETE" }> = [
        { url: `${API_BASE_URL}/social/scheduled-posts/${scheduledPostId}/cancel`, method: "POST" },
        { url: `${API_BASE_URL}/social/scheduled-posts/${scheduledPostId}/cancel/`, method: "POST" },
        { url: `${API_BASE_URL}/social/scheduled-posts/cancel/${scheduledPostId}`, method: "POST" },
        { url: `${API_BASE_URL}/social/scheduled-posts/${scheduledPostId}`, method: "DELETE" },
    ];

    let lastError = "Failed to cancel scheduled post";
    for (const attempt of attempts) {
        const res = await authenticatedFetch(attempt.url, { method: attempt.method });
        if (res.ok) {
            return res.json();
        }
        const data = await res.json().catch(() => ({}));
        // If route is missing, try next shape; otherwise surface concrete backend error.
        const detail = String(data.detail || "");
        if (res.status !== 404) {
            throw new Error(detail || "Failed to cancel scheduled post");
        }
        lastError = detail || lastError;
    }
    throw new Error(lastError || "Failed to cancel scheduled post");
}
