function normalizeBase(input: string): string {
    return input.replace(/\/+$/, "");
}

function buildApiBaseUrl(): string {
    const explicit = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (explicit) return normalizeBase(explicit);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (apiUrl) {
        const base = normalizeBase(apiUrl);
        if (base.endsWith("/api/v1")) return base;
        if (base.endsWith("/api")) return `${base}/v1`;
        return `${base}/api/v1`;
    }

    if (typeof window !== "undefined") {
        const host = window.location.hostname;
        if (host === "localhost" || host === "127.0.0.1") {
            return "http://localhost:8080/api/v1";
        }
    }

    // Default for same-domain deployments (dev/prod behind reverse proxy)
    return "/api/v1";
}

export const API_BASE_URL = buildApiBaseUrl();

// --- Auth Helper ---
// --- Auth Helper ---
export async function getAuthHeaders(): Promise<HeadersInit> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : null;
    return token ? {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    } : { "Content-Type": "application/json" };
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = await getAuthHeaders();
    const config = {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
    }

    return response;
}
