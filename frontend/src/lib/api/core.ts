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
const ACCESS_TOKEN_REFRESH_WINDOW_SECONDS = Number(process.env.NEXT_PUBLIC_ACCESS_TOKEN_REFRESH_WINDOW_SECONDS || 120);

function resolveUrl(url: string): string {
    if (!url) return API_BASE_URL;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/")) return url;
    return `${API_BASE_URL}/${url.replace(/^\/+/, "")}`;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(resolveUrl(url), options);
}

export function clearAuthSession(reason?: string) {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expires_at");
    localStorage.removeItem("user");
    if (reason) localStorage.setItem("auth_logout_reason", reason);
}

export function storeAuthSession(accessToken: string, refreshToken?: string, accessExpiresInSeconds?: number) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem("token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    if (accessExpiresInSeconds && Number.isFinite(accessExpiresInSeconds)) {
        const expiresAt = Date.now() + accessExpiresInSeconds * 1000;
        localStorage.setItem("token_expires_at", String(expiresAt));
    }
}

function getAccessTokenExpiresAt(): number | null {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem("token_expires_at");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
}

async function refreshAccessTokenIfNeeded(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    const accessToken = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refresh_token");
    if (!accessToken || !refreshToken) return;

    const expiresAt = getAccessTokenExpiresAt();
    if (!expiresAt) return;

    const remainingMs = expiresAt - Date.now();
    if (remainingMs > ACCESS_TOKEN_REFRESH_WINDOW_SECONDS * 1000) return;

    const res = await apiFetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
        let detail = "Session expired";
        try {
            const err = await res.json();
            detail = err?.detail || detail;
        } catch {
            // ignore
        }
        const inactive = String(detail).toLowerCase().includes("inactive");
        clearAuthSession(inactive ? "inactive" : "expired");
        if (typeof window !== "undefined") {
            window.location.href = inactive ? "/login?reason=inactive" : "/login";
        }
        return;
    }

    const data = await res.json();
    storeAuthSession(data.access_token, data.refresh_token, data.access_expires_in_seconds);
}

export async function maybeRefreshAuthSession(): Promise<void> {
    await refreshAccessTokenIfNeeded();
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
    await refreshAccessTokenIfNeeded();

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
            clearAuthSession("expired");
            window.location.href = "/login";
        }
    }

    if (response.status === 400 || response.status === 403) {
        try {
            const body = await response.clone().json();
            const detail = String(body?.detail || "").toLowerCase();
            if (detail.includes("inactive user") || detail.includes("inactive user.") || detail.includes("inactive")) {
                if (typeof window !== "undefined") {
                    clearAuthSession("inactive");
                    window.location.href = "/login?reason=inactive";
                }
            }
        } catch {
            // ignore non-json responses
        }
    }

    return response;
}
