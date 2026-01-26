import { API_BASE_URL } from "./core";

export interface Presentation {
    id: number;
    title: string;
    source_type: string;
    slides_json: Record<string, unknown>;
    slide_count: number;
    created_at: string;
}

export async function fetchPresentations(): Promise<Presentation[]> {
    const res = await fetch(`${API_BASE_URL}/presentation/`);
    if (!res.ok) throw new Error("Failed to fetch presentations");
    return res.json();
}

export async function fetchPresentationById(id: number): Promise<Presentation> {
    const res = await fetch(`${API_BASE_URL}/presentation/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch presentation with id ${id}`);
    return res.json();
}

export async function generatePresentation(data: { title: string; source_type: string }): Promise<Presentation> {
    const res = await fetch(`${API_BASE_URL}/presentation/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate presentation");
    return res.json();
}
