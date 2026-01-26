import { API_BASE_URL, getAuthHeaders } from "./core";

export interface Brand {
    id: number;
    name: string;
    logo_url?: string;
    industry?: string;
    description?: string;
    is_active: boolean;
    organization_id: number;
}

export interface BrandCreate {
    name: string;
    industry?: string;
    logo_url?: string;
    description?: string;
    organization_id?: number;
}

export async function fetchBrands(): Promise<Brand[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/brands/`, { headers });
    if (!res.ok) throw new Error("Failed to fetch brands");
    return res.json();
}

export async function createBrand(data: BrandCreate): Promise<Brand> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/brands/`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create brand");
    }
    return res.json();
}
