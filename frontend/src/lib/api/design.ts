import { API_BASE_URL } from "./core";

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

// Mock Data
let mockDesigns: DesignAsset[] = [];

export async function generateDesign(data: { title: string; style: string; aspect_ratio: string; prompt: string; brand_colors?: string; reference_image?: string }): Promise<DesignAsset> {
    // Mock
    return new Promise((resolve) => {
        setTimeout(() => {
            const newDesign: DesignAsset = {
                id: mockDesigns.length > 0 ? Math.max(...mockDesigns.map(d => d.id)) + 1 : 1,
                ...data,
                image_url: "https://via.placeholder.com/150", // Placeholder image for mock
                created_at: new Date().toISOString(),
            };
            mockDesigns.push(newDesign);
            resolve(newDesign);
        }, 1500);
    });
    // const res = await fetch(`${API_BASE_URL}/design/generate`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(data),
    // });
    // if (!res.ok) throw new Error("Failed to generate design");
    // return res.json();
}

export async function fetchDesignAssets(): Promise<DesignAsset[]> {
    // Mock
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockDesigns);
        }, 500);
    });
    // const res = await fetch(`${API_BASE_URL}/design/`);
    // if (!res.ok) throw new Error("Failed to fetch design assets");
    // return res.json();
}

export async function fetchDesignAssetById(id: number): Promise<DesignAsset> {
    // Mock
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const design = mockDesigns.find(d => d.id === id);
            if (design) {
                resolve(design);
            } else {
                reject(new Error(`Failed to fetch design asset with id ${id}`));
            }
        }, 500);
    });
    // const res = await fetch(`${API_BASE_URL}/design/${id}`);
    // if (!res.ok) throw new Error(`Failed to fetch design asset with id ${id}`);
    // return res.json();
}

export async function deleteDesign(id: number): Promise<void> {
    // Mock
    return new Promise((resolve) => {
        setTimeout(() => {
            mockDesigns = mockDesigns.filter(d => d.id !== id);
            resolve();
        }, 500);
    });
    // const res = await fetch(`${API_BASE_URL}/design/${id}`, {
    //     method: "DELETE",
    // });
    // if (!res.ok) throw new Error(`Failed to delete design asset with id ${id}`);
}
