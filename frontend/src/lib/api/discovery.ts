import { API_BASE_URL, authenticatedFetch } from "./core";

export interface InfluencerProfile {
    handle: string;
    platform: string;
    avatar_color: string;
    image_url?: string;  // Profile picture URL from API
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
    platform?: string;        // Instagram, TikTok, YouTube, etc.
    geo?: string;             // Country code (US, UK, etc.)
    engagement?: number;      // Minimum engagement rate
    niche?: string;           // Category: Fashion, Tech, etc.
}

export async function searchInfluencers(query: string, filters?: SearchFilters): Promise<InfluencerProfile[]> {
    const res = await authenticatedFetch(`${API_BASE_URL}/discovery/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filters }),
    });
    if (!res.ok) {
        const error = await res.text();
        console.error(`Search failed with status ${res.status}:`, error);
        throw new Error(`Failed to search influencers: ${res.status}`);
    }
    const data = await res.json();
    
    // Transform Influencers Club API response to InfluencerProfile format
    if (data.accounts && Array.isArray(data.accounts)) {
        const transformed = data.accounts.map((account: any, idx: number) => {
            const engagement = account.profile?.engagement_percent || 0;
            const followers = account.profile?.followers || 0;
            
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
                handle: account.profile?.username || account.user_id,
                platform: (filters?.platform || "instagram").toUpperCase(),
                avatar_color: ["bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-blue-500", "bg-emerald-500"][idx % 5],
                image_url: account.profile?.picture,  // Extract image URL from API response
                followers: followers,
                engagement_rate: engagement,
                content_style_match: contentStyles,
                voice_analysis: voiceTags,
                image_recognition_tags: ["Content Creation", "Social Media", "Influence"],
                audience_demographics: JSON.stringify({
                    followers: followers,
                    engagement: engagement,
                    name: account.profile?.full_name,
                }),
                match_score: Math.min(100, Math.round(30 + engagement * 10 + (followers > 10000 ? 20 : 0))),
            };
        });
        console.log(`Search for "${query}" returned ${transformed.length} results (total: ${data.total})`);
        return transformed;
    }
    
    return [];
}

export async function getInfluencerProfile(handle: string): Promise<InfluencerProfile> {
    const res = await authenticatedFetch(`${API_BASE_URL}/discovery/influencers/${encodeURIComponent(handle)}`);
    if (!res.ok) throw new Error("Failed to fetch influencer profile");
    return res.json();
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
