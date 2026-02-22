
export const API_BASE_URL = "http://localhost:8080/api/v1";

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
