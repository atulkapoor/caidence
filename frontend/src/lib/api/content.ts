import { API_BASE_URL, getAuthHeaders } from "./core";

export interface ContentGeneration {
    id: number;
    title: string;
    platform: string;
    content_type: string;
    result: string;
    created_at: string;
    prompt?: string;
}

// Mock Data
let mockGenerations: ContentGeneration[] = [
    { id: 1, title: "LinkedIn Thought Leadership", platform: "LinkedIn", content_type: "Post", result: "AI puts the 'Art' in Artificial Intelligence...", created_at: new Date().toISOString(), prompt: "Write about AI" },
    { id: 2, title: "Twitter Thread: SEO Tips", platform: "Twitter", content_type: "Thread", result: "1/5 SEO is dead? No. Here's why...", created_at: new Date(Date.now() - 86400000).toISOString(), prompt: "SEO Tips" }
];

export async function generateContent(data: any): Promise<ContentGeneration> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/content/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate content");
    return res.json();
}

export async function fetchContentGenerations(): Promise<ContentGeneration[]> {
    // Mock 
    if (mockGenerations.length === 0) {
        // This block would typically fetch from an API, but for mocking, we return initial data if empty
        return [
            { id: 1, title: "LinkedIn Thought Leadership", platform: "LinkedIn", content_type: "Post", result: "AI puts the 'Art' in Artificial Intelligence...", created_at: new Date().toISOString(), prompt: "Write about AI" },
            { id: 2, title: "Twitter Thread: SEO Tips", platform: "Twitter", content_type: "Thread", result: "1/5 SEO is dead? No. Here's why...", created_at: new Date(Date.now() - 86400000).toISOString(), prompt: "SEO Tips" }
        ];
    }
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockGenerations);
        }, 500);
    });
}

export async function fetchContentGenerationById(id: number): Promise<ContentGeneration> {
    const res = await fetch(`${API_BASE_URL}/content/${id}`);
    if (!res.ok) throw new Error("Failed to fetch content details");
    return res.json();
}

export async function deleteContent(id: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            mockGenerations = mockGenerations.filter(c => c.id !== id);
            resolve();
        }, 500);
    });
}
