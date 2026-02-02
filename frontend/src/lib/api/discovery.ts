import { API_BASE_URL } from "./core";

export interface InfluencerProfile {
    handle: string;
    platform: string;
    avatar_color: string;
    followers: number;
    engagement_rate: number;
    content_style_match: string[];
    voice_analysis: string[];
    image_recognition_tags: string[];
    audience_demographics: string;
    match_score: number;
}


export interface SearchFilters {
    reach?: number;
    platform?: string;
    geo?: string;
}

export async function searchInfluencers(query: string, filters?: SearchFilters): Promise<InfluencerProfile[]> {
    const res = await fetch(`${API_BASE_URL}/discovery/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filters }),
    });
    if (!res.ok) throw new Error("Failed to search influencers");
    return res.json();
}

export async function getInfluencerProfile(handle: string): Promise<InfluencerProfile> {
    const res = await fetch(`${API_BASE_URL}/discovery/influencers/${encodeURIComponent(handle)}`);
    if (!res.ok) throw new Error("Failed to fetch influencer profile");
    return res.json();
}
