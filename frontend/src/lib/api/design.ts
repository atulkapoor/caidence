import { API_BASE_URL, getAuthHeaders } from "./core";

export interface DesignAsset {
    id: number;
    title: string;
    style: string;
    aspect_ratio: string;
    prompt: string;
    image_url: string;
    created_at: string;
    brand_colors?: string;
    reference_image?: string;
}

export async function generateDesign(data: { title: string; style: string; aspect_ratio: string; prompt: string; brand_colors?: string; reference_image?: string }): Promise<DesignAsset> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/design/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate design");
    return res.json();
}

export async function fetchDesignAssets(): Promise<DesignAsset[]> {
    const res = await fetch(`${API_BASE_URL}/design/`);
    if (!res.ok) throw new Error("Failed to fetch design assets");
    return res.json();
}

export async function fetchDesignAssetById(id: number): Promise<DesignAsset> {
    const res = await fetch(`${API_BASE_URL}/design/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch design asset with id ${id}`);
    return res.json();
}

export async function deleteDesign(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/design/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error(`Failed to delete design asset with id ${id}`);
}
