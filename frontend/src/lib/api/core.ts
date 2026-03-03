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

function resolveUrl(url: string): string {
    if (!url) return API_BASE_URL;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/")) return url;
    return `${API_BASE_URL}/${url.replace(/^\/+/, "")}`;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(resolveUrl(url), options);
}

export async function getAuthHeaders(options: { includeJsonContentType?: boolean } = {}): Promise<HeadersInit> {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    const includeJsonContentType = options.includeJsonContentType ?? true;

    const headers: Record<string, string> = {};
    if (includeJsonContentType) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return headers;
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    const mergedHeaders = new Headers(options.headers);

    if (token && !mergedHeaders.has("Authorization")) {
        mergedHeaders.set("Authorization", `Bearer ${token}`);
    }

    const hasBody = options.body !== undefined && options.body !== null;
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    if (hasBody && !isFormData && !mergedHeaders.has("Content-Type")) {
        mergedHeaders.set("Content-Type", "application/json");
    }

    const response = await apiFetch(url, {
        ...options,
        headers: mergedHeaders,
    });

    if (response.status === 401) {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
    }

    return response;
}
