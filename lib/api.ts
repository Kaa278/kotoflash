// Central API client for Next.js API Routes
// If NEXT_PUBLIC_API_URL is set (e.g. on Vercel), it uses that.
// Otherwise, it uses the relative path (for local dev).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/auth";

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
