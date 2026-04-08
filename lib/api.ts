// Central API client for Next.js API Routes
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function getApiUrl(path: string) {
    const isAuth = path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/profile") || path.startsWith("/words");
    const prefix = isAuth ? "/api/auth" : "/api";

    if (!BASE_URL) return `${prefix}${path}`;
    return `${BASE_URL}${prefix}${path}`;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const url = getApiUrl(endpoint);
    const token = localStorage.getItem("kotoflash_token");

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(url, {
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
