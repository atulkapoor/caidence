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
}

export interface WhatsAppContact {
    id: number;
    handle: string;
    name?: string | null;
    brand_id?: number | null;
    whatsapp_numbers: string[];
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
