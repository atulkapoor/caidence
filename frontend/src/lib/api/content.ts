import { API_BASE_URL } from "./core";

export interface ContentGeneration {
    id: number;
    title: string;
    platform: string;
    content_type: string;
    prompt: string;
    result: string;
    created_at: string;
}

export async function generateContent(data: { title: string; platform: string; content_type: string; prompt: string }): Promise<ContentGeneration> {
    const res = await fetch(`${API_BASE_URL}/content/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate content");
    return res.json();
}

export async function fetchContentGenerations(): Promise<ContentGeneration[]> {
    const res = await fetch(`${API_BASE_URL}/content/`);
    if (!res.ok) throw new Error("Failed to fetch content history");
    return res.json();
}

export async function fetchContentGenerationById(id: number): Promise<ContentGeneration> {
    const res = await fetch(`${API_BASE_URL}/content/${id}`);
    if (!res.ok) throw new Error("Failed to fetch content details");
    return res.json();
}
