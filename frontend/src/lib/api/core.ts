
export const API_BASE_URL = "/api";

// --- Auth Helper ---
export async function getAuthHeaders(): Promise<HeadersInit> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : null;
    return token ? {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    } : { "Content-Type": "application/json" };
}
