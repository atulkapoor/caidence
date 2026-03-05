import { API_BASE_URL, authenticatedFetch } from "./core";

export interface InfluencerProfile {
    id: string;
    handle: string;
    platform: string;
    avatar_color: string;
    image_url?: string;  // Profile picture URL from API
    recent_posts?: Array<{
        post_id: string;
        post_url?: string;
        media_url?: string;
        caption?: string;
    }>;
    followers: number;
    engagement_rate: number;
    content_style_match: string[];
    voice_analysis: string[];
    image_recognition_tags: string[];
    audience_demographics: string;
    match_score: number;
}


export interface SearchFilters {
    min_reach?: number;       // Minimum follower count
    max_reach?: number;       // Maximum follower count
    platform?: string;        // Instagram, TikTok, YouTube, etc.
    geo?: string;             // Country code (US, UK, etc.)
    engagement?: number;      // Minimum engagement rate
    niche?: string;           // Category: Fashion, Tech, etc.
}

function getIdentityQueryCandidate(rawQuery: string): string | null {
    const trimmed = (rawQuery || "").trim();
    if (!trimmed) return null;

    const usernameCandidate = trimmed.replace(/^@+/, "");
    if (/^[A-Za-z0-9._-]{2,64}$/.test(usernameCandidate)) {
        return usernameCandidate.toLowerCase();
    }

    const normalized = trimmed.replace(/\s+/g, " ");
    const words = normalized.split(" ");
    if (
        words.length >= 2 &&
        words.length <= 4 &&
        /^[A-Za-z][A-Za-z0-9 .'\-]{1,80}$/.test(normalized)
    ) {
        return normalized.toLowerCase();
    }
    return null;
}

function normalizeHandle(raw: string | undefined): string {
    const value = (raw || "").trim().replace(/^@+/, "");
    return value ? `@${value}` : "@unknown";
}

function toNumber(value: unknown, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function buildProfileId(handle: string, platform: string): string {
    return `${platform.toUpperCase()}:${handle.replace(/^@+/, "").toLowerCase()}`;
}

function extractEnrichPlatformPayload(data: any, fallbackPlatform: string): any {
    const resultObj = data?.result;
    if (resultObj && typeof resultObj === "object") {
        const byRequested = resultObj[fallbackPlatform?.toLowerCase?.() || "instagram"];
        if (byRequested && typeof byRequested === "object") return byRequested;

        const first = Object.values(resultObj).find((value) => value && typeof value === "object");
        if (first && typeof first === "object") return first;
    }
    return data?.profile || data?.creator || data?.user || data || {};
}

function estimateEngagementPercent(payload: any, followers: number): number {
    const direct = toNumber(payload?.engagement_percent ?? payload?.engagement_rate, NaN);
    if (Number.isFinite(direct)) return direct;

    const posts = Array.isArray(payload?.post_data) ? payload.post_data : [];
    if (!posts.length || followers <= 0) return 0;

    const sample = posts.slice(0, 12);
    const totalInteractions = sample.reduce((acc: number, post: any) => {
        const likes = toNumber(post?.engagement?.likes, 0);
        const comments = toNumber(post?.engagement?.comments, 0);
        return acc + likes + comments;
    }, 0);
    const avgInteractions = totalInteractions / sample.length;
    return Number(((avgInteractions / followers) * 100).toFixed(2));
}

export async function searchInfluencers(query: string, filters?: SearchFilters): Promise<InfluencerProfile[]> {
    const res = await authenticatedFetch(`${API_BASE_URL}/discovery/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filters }),
    });
    if (!res.ok) {
        let message = `Failed to search influencers: ${res.status}`;
        const raw = await res.text();
        try {
            const parsed = JSON.parse(raw);
            if (parsed?.detail) {
                message = String(parsed.detail);
            } else if (parsed?.error) {
                message = String(parsed.error);
            }
        } catch {
            if (raw) message = raw;
        }
        console.error(`Search failed with status ${res.status}:`, raw);
        throw new Error(message);
    }
    const data = await res.json();
    
    // Transform Influencers Club API response to InfluencerProfile format
    if (data.accounts && Array.isArray(data.accounts)) {
        const transformed = data.accounts.map((account: any, idx: number) => {
            const profile = account.profile || {};
            const engagement = toNumber(profile.engagement_percent || profile.engagement_rate, 0);
            const followers = toNumber(profile.followers || profile.follower_count, 0);
            const platform = String(
                profile.platform ||
                account.platform ||
                filters?.platform ||
                "instagram"
            ).toUpperCase();
            const username = profile.username || account.username || account.user_id;
            const fullName = profile.full_name || profile.name;
            const city = profile.city || account.city;
            const country = profile.country || account.country;
            
            // Generate varied content styles based on query and engagement
            const contentStyles = query 
                ? query.split(" ").slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1))
                : ["Professional", "Authentic"];
            
            // Generate voice analysis based on engagement level
            const voiceTags = engagement > 5 
                ? ["Engaging", "Authentic", "Conversational"]
                : engagement > 2
                ? ["Professional", "Clear", "Informative"]
                : ["Consistent", "Reliable", "Steady"];
            
            return {
                id: buildProfileId(normalizeHandle(username), platform),
                handle: normalizeHandle(username),
                platform,
                avatar_color: ["#6366f1", "#a855f7", "#ec4899", "#3b82f6", "#10b981"][idx % 5],
                image_url: profile.picture || profile.profile_picture || profile.avatar_url,
                followers: followers,
                engagement_rate: engagement,
                content_style_match: contentStyles,
                voice_analysis: voiceTags,
                image_recognition_tags: ["Content Creation", "Social Media", "Influence"].concat(fullName ? [fullName] : []),
                audience_demographics: [city, country].filter(Boolean).join(", ") || "Global audience",
                match_score: Math.min(100, Math.round(30 + engagement * 10 + (followers > 10000 ? 20 : 0))),
            };
        });

        const filtered = transformed.filter((profile) => {
            if (filters?.min_reach !== undefined && profile.followers < filters.min_reach) return false;
            if (filters?.max_reach !== undefined && profile.followers > filters.max_reach) return false;
            if (filters?.engagement !== undefined && profile.engagement_rate < filters.engagement) return false;
            return true;
        });

        const identityQuery = getIdentityQueryCandidate(query);
        const identityFiltered = identityQuery
            ? filtered.filter((profile) => {
                const handle = profile.handle.replace(/^@+/, "").toLowerCase();
                const tags = profile.image_recognition_tags.join(" ").toLowerCase();
                return handle.includes(identityQuery) || tags.includes(identityQuery);
            })
            : filtered;

        const dedupedByIdentity = Array.from(
            new Map(identityFiltered.map((profile) => [profile.id, profile])).values()
        );

        console.log(`Search for "${query}" returned ${dedupedByIdentity.length} unique results (raw total: ${data.total})`);
        return dedupedByIdentity;
    }
    
    return [];
}

export async function getInfluencerProfile(handle: string, platform = "instagram"): Promise<InfluencerProfile> {
    const cleanHandle = handle.replace(/^@+/, "");
    const res = await authenticatedFetch(
        `${API_BASE_URL}/discovery/enrich?platform=${encodeURIComponent(platform.toLowerCase())}&handle=${encodeURIComponent(cleanHandle)}&mode=raw`,
        { method: "POST" }
    );
    if (!res.ok) throw new Error("Failed to fetch influencer profile");

    const data = await res.json();
    const payload = extractEnrichPlatformPayload(data, platform);

    const username = payload.username || payload.handle || payload.user?.username || cleanHandle;
    const followers = toNumber(payload.follower_count || payload.followers, 0);
    const engagement = estimateEngagementPercent(payload, followers);
    const fullName = payload.full_name || payload.name;
    const city = payload.city;
    const country = payload.country;
    const recentPosts = (Array.isArray(payload.post_data) ? payload.post_data : []).slice(0, 8).map((post: any) => ({
        post_id: String(post?.post_id || ""),
        post_url: post?.post_url,
        media_url: post?.media?.[0]?.url,
        caption: post?.caption,
    })).filter((post: any) => post.post_id);
    const resolvedPlatform = String(payload.platform || platform || "instagram").toUpperCase();

    return {
        id: buildProfileId(normalizeHandle(username), resolvedPlatform),
        handle: normalizeHandle(username),
        platform: resolvedPlatform,
        avatar_color: "#6366f1",
        image_url: payload.profile_picture_hd || payload.profile_picture || payload.picture || payload.avatar_url,
        recent_posts: recentPosts,
        followers,
        engagement_rate: engagement,
        content_style_match: fullName ? [fullName] : ["Creator"],
        voice_analysis: ["Authentic", "Consistent"],
        image_recognition_tags: ["Profile Enriched", "Influencer"],
        audience_demographics: [city, country].filter(Boolean).join(", ") || "Global audience",
        match_score: Math.min(100, Math.round(50 + engagement * 6 + (followers > 10000 ? 20 : 0))),
    };
}

export async function searchByImage(file: File): Promise<InfluencerProfile[]> {
    const formData = new FormData();
    formData.append("file", file);

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : null;
    const headers: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};

    const res = await fetch(`${API_BASE_URL}/discovery/image-search`, {
        method: "POST",
        body: formData,
        headers,
    });

    if (!res.ok) throw new Error("Failed to perform visual search");
    return res.json();
}
