import { API_BASE_URL, getAuthHeaders } from "./core";

export interface CampaignHistory {
    campaign_name: string;
    date: string;
    roi_multiple: number;
    status: string;
}

export interface RelationshipProfile {
    creator_id?: number | null;
    handle: string;
    platform: string;
    avatar_color: string;
    relationship_status: "Active" | "Vetted" | "Past" | "Blacklisted";
    total_spend: number;
    avg_roi: number;
    last_contact: string;
    campaign_history: CampaignHistory[];
    whatsapp_numbers?: string[] | null;
    can_edit?: boolean;
    category_ids?: number[];
    category_names?: string[];
}

export interface WhatsAppContact {
    id: number;
    handle: string;
    name?: string | null;
    brand_id?: number | null;
    whatsapp_numbers: string[];
    category_ids?: number[];
}

export async function fetchRelationships(): Promise<RelationshipProfile[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/relationships`, { headers });
    if (!res.ok) throw new Error("Failed to fetch relationships");
    return res.json();
}

export interface RelationshipPayload {
    handle: string;
    platform?: string;
    relationship_status?: "Active" | "Vetted" | "Past" | "Blacklisted";
    whatsapp_numbers?: string[] | null;
    name?: string | null;
    category_ids?: number[] | null;
}

export interface CrmCategoryBrandOption {
    id: number;
    name: string;
}

export interface CrmCategory {
    id: number;
    name: string;
    user_id: number;
    brand_ids: number[];
    is_active: boolean;
    created_at?: string | null;
    brands: CrmCategoryBrandOption[];
}

export interface CrmCategoryPayload {
    name: string;
    brand_ids: number[];
}

export interface CrmGeneratePost {
    id: number;
    user_id: number;
    title: string;
    platform: string;
    brand_id?: number | null;
    description?: string | null;
    image_url?: string | null;
    image_name?: string | null;
    is_posted?: boolean;
    posted_at?: string | null;
    posted_target_name?: string | null;
    posted_recipients?: string[] | null;
    created_at?: string | null;
}

export interface CrmGeneratePostPayload {
    title?: string;
    platform: string;
    brand_id?: number | null;
    description?: string | null;
    image_url?: string | null;
    image_name?: string | null;
    is_posted?: boolean;
    posted_target_name?: string | null;
    posted_recipients?: string[] | null;
}

export async function createRelationship(payload: RelationshipPayload): Promise<RelationshipProfile> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/relationships`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to create relationship");
    }
    return res.json();
}

export async function updateRelationship(creatorId: number, payload: RelationshipPayload): Promise<RelationshipProfile> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/relationships/${creatorId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update relationship");
    }
    return res.json();
}

export async function deleteRelationship(creatorId: number): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/relationships/${creatorId}`, {
        method: "DELETE",
        headers,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete relationship");
    }
}

export async function generateXRayReport(handle: string): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/generate-report?handle=${handle}`, {
        method: "POST",
        headers
    });
    if (!res.ok) throw new Error("Failed to generate report");
    return res.json();
}

export async function fetchWhatsAppContacts(): Promise<WhatsAppContact[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/whatsapp-contacts`, { headers });
    if (!res.ok) throw new Error("Failed to fetch WhatsApp contacts");
    return res.json();
}

export async function uploadWhatsAppContacts(file: File): Promise<{ updated: number; skipped: number; errors: string[] }> {
    const headers = await getAuthHeaders({ includeJsonContentType: false });
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE_URL}/crm/whatsapp-import`, {
        method: "POST",
        headers,
        body: form,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to import WhatsApp contacts");
    }
    return res.json();
}

export async function uploadCrmRelationships(file: File): Promise<{ created: number; updated: number; skipped: number; errors: string[] }> {
    const headers = await getAuthHeaders({ includeJsonContentType: false });
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE_URL}/crm/relationships-import`, {
        method: "POST",
        headers,
        body: form,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to import CRM relationships");
    }
    return res.json();
}

export async function downloadCrmTemplate(): Promise<Blob> {
    const headers = await getAuthHeaders({ includeJsonContentType: false });
    const res = await fetch(`${API_BASE_URL}/crm/relationships-template`, { headers });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to download CRM template");
    }
    return res.blob();
}

export async function fetchCrmCategoryBrandOptions(): Promise<CrmCategoryBrandOption[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/category-brand-options`, { headers });
    if (!res.ok) throw new Error("Failed to fetch category brands");
    return res.json();
}

export async function fetchCrmCategories(): Promise<CrmCategory[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/categories`, { headers });
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
}

export async function createCrmCategory(payload: CrmCategoryPayload): Promise<CrmCategory> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/categories`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to create category");
    }
    return res.json();
}

export async function updateCrmCategory(categoryId: number, payload: Partial<CrmCategoryPayload>): Promise<CrmCategory> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/categories/${categoryId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update category");
    }
    return res.json();
}

export async function deleteCrmCategory(categoryId: number): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/categories/${categoryId}`, {
        method: "DELETE",
        headers,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete category");
    }
}

export async function fetchCrmGeneratePosts(): Promise<CrmGeneratePost[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/generate-posts`, { headers });
    if (!res.ok) throw new Error("Failed to fetch generate posts");
    return res.json();
}

export async function createCrmGeneratePost(payload: CrmGeneratePostPayload): Promise<CrmGeneratePost> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/generate-posts`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to create generate post");
    }
    return res.json();
}

export async function updateCrmGeneratePost(postId: number, payload: Partial<CrmGeneratePostPayload>): Promise<CrmGeneratePost> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/generate-posts/${postId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update generate post");
    }
    return res.json();
}

export async function deleteCrmGeneratePost(postId: number): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/crm/generate-posts/${postId}`, {
        method: "DELETE",
        headers,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete generate post");
    }
}
