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

export async function saveContent(data: any): Promise<ContentGeneration> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/content/save`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save content");
    return res.json();
}

export async function fetchContentGenerations(): Promise<ContentGeneration[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/content`, { headers });
    if (!res.ok) throw new Error("Failed to fetch content history");
    return res.json();
}

export async function fetchContentGenerationById(id: number): Promise<ContentGeneration> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/content/${id}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch content details");
    return res.json();
}

export async function deleteContent(id: number): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/content/${id}`, {
        method: "DELETE",
        headers
    });
    if (!res.ok) throw new Error("Failed to delete content");
}
