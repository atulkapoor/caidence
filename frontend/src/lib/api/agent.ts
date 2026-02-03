import { API_BASE_URL, getAuthHeaders } from "./core";

export interface CampaignDraft {
    title: string;
    description: string;
    budget: string;
    channels: string[];
    agent_logs?: string[];
    alternative_draft?: CampaignDraft;
}

export interface Strategy {
    id: number;
    title: string;
    description: string;
    created_at: string;
    strategy: any; // The full JSON blob
}

// Mock Data for History
let MOCK_HISTORY: Strategy[] = [
    {
        id: 101,
        title: "Luxury Apartment Launch",
        description: "High-end campaign targeting HNWIs for city-center launch.",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        strategy: {
            target_audience: [{ name: "Urban Professionals", description: "Income $150k+, aged 30-45" }],
            key_channels: ["LinkedIn", "Instagram"],
            content_ideas: [{ title: "Morning Routine", format: "Reel", description: "Showcasing amenities" }],
            strategic_recommendations: ["Partner with local luxury brands"]
        }
    },
    {
        id: 102,
        title: "Q3 Brand Awareness",
        description: "General brand lift campaign for agency services.",
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        strategy: {
            target_audience: [{ name: "SME Owners", description: "Revenue $1M-5M" }],
            key_channels: ["Email", "LinkedIn"],
            content_ideas: [{ title: "Case Study", format: "PDF", description: "Success story breakdown" }],
            strategic_recommendations: ["Host a webinar"]
        }
    }
];

export async function generateCampaignPlan(goal: string, product: string, audience: string): Promise<CampaignDraft> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/agent/draft_campaign`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ goal, product, audience }),
    });
    if (!res.ok) throw new Error("Failed to generate campaign details");
    return res.json();
}

export async function enhanceDescription(text: string): Promise<string> {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/agent/enhance_description`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error("Failed to enhance description");
        const data = await res.json();
        return data.enhanced_text;
    } catch (error) {
        console.error("Enhance API failed, using mock enhancement:", error);
        // Mock enhancement: add professional polish to the text
        const enhancements = [
            "Transform your ideas into reality with our innovative approach. ",
            "Leveraging cutting-edge solutions, ",
            "Drive exceptional results by ",
            "Elevate your strategy through "
        ];
        const closings = [
            " This positions you for sustainable growth and market leadership.",
            " Experience the difference that professional expertise makes.",
            " Unlock new possibilities with data-driven insights.",
            " Stay ahead of the competition with forward-thinking solutions."
        ];
        const prefix = enhancements[Math.floor(Math.random() * enhancements.length)];
        const suffix = closings[Math.floor(Math.random() * closings.length)];
        return `${prefix}${text}${suffix}`;
    }
}

export async function fetchStrategyHistory(): Promise<Strategy[]> {
    // Mock API call
    return new Promise((resolve) => {
        setTimeout(() => resolve([...MOCK_HISTORY]), 500);
    });
}

export async function updateStrategy(id: number, strategyData: any): Promise<Strategy> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const index = MOCK_HISTORY.findIndex(s => s.id === id);
            if (index !== -1) {
                MOCK_HISTORY[index] = { ...MOCK_HISTORY[index], strategy: strategyData };
                resolve(MOCK_HISTORY[index]);
            } else {
                // If not found (e.g. new session), just return valid object
                resolve({
                    id,
                    title: "Updated Project",
                    description: "Updated",
                    created_at: new Date().toISOString(),
                    strategy: strategyData
                });
            }
        }, 800);
    });
}

export async function deleteStrategy(id: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            MOCK_HISTORY = MOCK_HISTORY.filter(s => s.id !== id);
            resolve();
        }, 500);
    });
}
