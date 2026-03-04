import { API_BASE_URL, authenticatedFetch } from "./core";

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
    is_posted?: boolean;
    posted_at?: string | null;
    posted_target_name?: string | null;
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

export interface DesignAssetsPage {
    items: DesignAsset[];
    total: number;
}

function normalizeDesignImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("data:")) {
        return imageUrl;
    }
    if (imageUrl.startsWith("/")) {
        try {
            const apiOrigin = API_BASE_URL.startsWith("http")
                ? new URL(API_BASE_URL).origin
                : (typeof window !== "undefined" ? window.location.origin : "");
            return apiOrigin ? `${apiOrigin}${imageUrl}` : imageUrl;
        } catch {
            return imageUrl;
        }
    }
    return imageUrl;
}

export async function generateDesign(data: GenerateDesignRequest): Promise<DesignAsset> {
    const res = await authenticatedFetch(`${API_BASE_URL}/design/generate`, {
        method: "POST",
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
    const res = await authenticatedFetch(`${API_BASE_URL}/design/save`, {
        method: "POST",
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save design");
    const saved = await res.json();
    return {
        ...saved,
        image_url: normalizeDesignImageUrl(saved.image_url),
    };
}

export async function fetchDesignAssets(params?: { skip?: number; limit?: number }): Promise<DesignAsset[]> {
    const query = new URLSearchParams();
    if (typeof params?.skip === "number") query.set("skip", String(params.skip));
    if (typeof params?.limit === "number") query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";

    let res = await authenticatedFetch(`${API_BASE_URL}/design${suffix}`);
    if (!res.ok) {
        // Fallback for backends configured with trailing slash routing.
        res = await authenticatedFetch(`${API_BASE_URL}/design/${suffix ? `?${query.toString()}` : ""}`);
    }
    if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "Failed to fetch design assets");
    }

    const payload = await res.json();
    const assets = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
                ? payload.data
                : [];

    return assets.map((asset: DesignAsset) => ({
        ...asset,
        image_url: normalizeDesignImageUrl(asset.image_url),
    }));
}

export async function fetchDesignAssetsPage(params?: {
    skip?: number;
    limit?: number;
    q?: string;
    style?: string;
}): Promise<DesignAssetsPage> {
    const query = new URLSearchParams();
    if (typeof params?.skip === "number") query.set("skip", String(params.skip));
    if (typeof params?.limit === "number") query.set("limit", String(params.limit));
    if (params?.q) query.set("q", params.q);
    if (params?.style && params.style !== "All Types") query.set("style", params.style);
    const suffix = query.toString() ? `?${query.toString()}` : "";

    let res = await authenticatedFetch(`${API_BASE_URL}/design${suffix}`);
    if (!res.ok) {
        res = await authenticatedFetch(`${API_BASE_URL}/design/${suffix ? `?${query.toString()}` : ""}`);
    }
    if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "Failed to fetch design assets");
    }
    const total = Number(res.headers.get("X-Total-Count") || "0");
    const payload = await res.json();
    const assets = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
                ? payload.data
                : [];
    return {
        total: Number.isNaN(total) ? 0 : total,
        items: assets.map((asset: DesignAsset) => ({
            ...asset,
            image_url: normalizeDesignImageUrl(asset.image_url),
        })),
    };
}

export async function fetchDesignAssetById(id: number): Promise<DesignAsset> {
    const res = await authenticatedFetch(`${API_BASE_URL}/design/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch design asset with id ${id}`);
    const asset = await res.json();
    return {
        ...asset,
        image_url: normalizeDesignImageUrl(asset.image_url),
    };
}

export async function deleteDesign(id: number): Promise<void> {
    const res = await authenticatedFetch(`${API_BASE_URL}/design/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error(`Failed to delete design asset with id ${id}`);
}
