import { API_BASE_URL, authenticatedFetch } from './core';

export interface UserProfile {
    id: number;
    email: string;
    full_name: string | null;
    company: string | null;
    location: string | null;
    bio: string | null;
    industry: string | null;
    role: string;
    organization_id: number | null;
    is_active: boolean;
}

export interface ProfileUpdateData {
    full_name?: string;
    company?: string;
    location?: string;
    bio?: string;
    industry?: string;
}

export interface SocialMediaModel {
    user_id: number;
    id: number;
    access_token: string | null;
    account_name: string | null;
    created_at: string;
    platform: string | null;
    client_id: string | null;
    client_secret: string | null;
    refresh_token: string | null;
    expires_at: string | null;
    account_id: string | null;
    account_email: string | null;
}

export interface SocialMediaAdd {
    platform: string;
    client_id: string;
    client_secret: string;
    account_id: string;
    account_name: string;
    account_email: string;
}

export async function getProfile(): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/profile/`);
    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }
    return response.json();
}

export async function updateProfile(data: ProfileUpdateData): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/profile/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to update profile');
    }
    return response.json();
}


export async function fetchSoical(): Promise<SocialMediaModel[]> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/Read`);
    if (!res.ok) throw new Error("Failed to fetch setting read");
    return res.json();
}


export async function createSocial(
    data: SocialMediaAdd
): Promise<SocialMediaModel> {
    const res = await authenticatedFetch(`${API_BASE_URL}/social/Create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create social media");
    }

    return res.json();
}

export async function updateSocial(
    credentialId: number,
    data: SocialMediaAdd
): Promise<void> {
    const res = await authenticatedFetch(
        `${API_BASE_URL}/social/${credentialId}/Update`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }
    );

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update social media");
    }
}

export async function deleteSocial(
  credentialId: number
): Promise<void> {
    const res = await authenticatedFetch(
        `${API_BASE_URL}/social/${credentialId}/Delete`,
        { method: "DELETE" }
    );

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to delete social media");
    }
}