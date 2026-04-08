// Central API client for Next.js API Routes
// This works on both Laptop (dev) and STB (prod) using relative paths.
const API_BASE_URL = "/api/auth";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("kotoflash_token");

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem("kotoflash_token");
            localStorage.removeItem("kotoflash_profile");
            // Optional: window.location.reload() to force state update
        }
        const error = await response.text();
        throw new Error(error || response.statusText);
    }

    return response.json();
}
