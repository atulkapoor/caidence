import { API_BASE_URL, authenticatedFetch } from "./core";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    requires_password_reset?: boolean;
    access_expires_in_seconds?: number;
}

export interface RegisterData {
    full_name: string;
    email: string;
    password: string;
    role?: string;
}

export async function login(data: LoginCredentials): Promise<LoginResponse> {
    const params = new URLSearchParams();
    params.append('username', data.email);
    params.append('password', data.password);

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login failed");
    }

    return res.json();
}

export async function register(data: RegisterData) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Registration failed");
    }

    return res.json();
}
// ... existing imports

export interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
    organization_id: number | null;
    is_active: boolean;
    is_approved: boolean;
    must_reset_password?: boolean;
}

export async function fetchCurrentUser(): Promise<User> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const res = await authenticatedFetch(`${API_BASE_URL}/auth/me`, {
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        try {
            const err = await res.json();
            throw new Error(err.detail || "Failed to fetch user");
        } catch {
            throw new Error("Failed to fetch user");
        }
    }
    return res.json();
}

export async function refreshToken(refresh_token: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Refresh token failed");
    }
    return res.json();
}

export async function changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password, new_password }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to change password");
    }
    return res.json();
}
