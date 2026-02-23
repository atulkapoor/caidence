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

export interface GenerateDesignRequest {
    title: string;
    style: string;
    aspect_ratio: string;
    prompt: string;
    model?: string;
    brand_colors?: string;
    reference_image?: string;
}

function normalizeDesignImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("data:")) {
        return imageUrl;
    }
    if (imageUrl.startsWith("/")) {
        const apiOrigin = new URL(API_BASE_URL).origin;
        return `${apiOrigin}${imageUrl}`;
    }
    return imageUrl;
}

export async function generateDesign(data: GenerateDesignRequest): Promise<DesignAsset> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/design/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate design");
    return res.json();
}

export async function saveDesign(data: {
    id?: number | null;
    title: string;
    style: string;
    aspect_ratio: string;
    prompt: string;
    image_url: string;
    model?: string;
    brand_colors?: string;
    reference_image?: string;
}): Promise<DesignAsset> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/design/save`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save design");
    const saved = await res.json();
    return {
        ...saved,
        image_url: normalizeDesignImageUrl(saved.image_url),
    };
}

export async function fetchDesignAssets(): Promise<DesignAsset[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/design/`, { headers });
    if (!res.ok) throw new Error("Failed to fetch design assets");
    const assets = await res.json();
    return assets.map((asset: DesignAsset) => ({
        ...asset,
        image_url: normalizeDesignImageUrl(asset.image_url),
    }));
}

export async function fetchDesignAssetById(id: number): Promise<DesignAsset> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/design/${id}`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch design asset with id ${id}`);
    const asset = await res.json();
    return {
        ...asset,
        image_url: normalizeDesignImageUrl(asset.image_url),
    };
}

export async function deleteDesign(id: number): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/design/${id}`, {
        method: "DELETE",
        headers,
    });
    if (!res.ok) throw new Error(`Failed to delete design asset with id ${id}`);
}
