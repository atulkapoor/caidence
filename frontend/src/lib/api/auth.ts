import { API_BASE_URL } from "./core";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    full_name: string;
    email: string;
    password: string;
    role?: string;
}

export async function login(data: LoginCredentials) {
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
