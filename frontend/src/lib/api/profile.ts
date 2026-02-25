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


export async function getProfile(): Promise<UserProfile> {
    const response = await authenticatedFetch(`${API_BASE_URL}/profile/`);
    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }
    return response.json();
}

export async function updateProfile(data: ProfileUpdateData): Promise<UserProfile> {
    const response = await authenticatedFetch(`${API_BASE_URL}/profile/`, {
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
