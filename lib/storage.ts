import { apiFetch } from "./api";

export type Word = {
    word: string;
    meaning: string;
    example?: string;
};

export type UserProfile = {
    id?: number;
    name: string;
    bio: string;
    avatar?: string; // Base64 or URL
    username?: string;
};

const TOKEN_KEY = "kotoflash_token";

const STORAGE_KEY = "kotoflash_words";

export function getWords(): Word[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveWord(word: Word): Word {
    const words = getWords();
    const existingIndex = words.findIndex(w => w.word === word.word);

    if (existingIndex !== -1) {
        words[existingIndex] = { ...words[existingIndex], ...word };
    } else {
        words.push(word);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));

    // Async sync if logged in
    if (isLoggedIn()) {
        apiFetch("/words", {
            method: "POST",
            body: JSON.stringify({ words: word })
        }).catch(err => console.error("Sync error:", err));
    }

    return word;
}

export function saveWords(words: Word[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

export function updateWord(targetWord: string, updates: Partial<Word>): void {
    const words = getWords();
    const index = words.findIndex((w) => w.word === targetWord);
    if (index !== -1) {
        words[index] = { ...words[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(words));

        // Async sync if logged in
        if (isLoggedIn()) {
            apiFetch("/words", {
                method: "POST",
                body: JSON.stringify({ words: words[index] })
            }).catch(err => console.error("Sync error:", err));
        }
    }
}

export function deleteWord(targetWord: string): void {
    const words = getWords();
    const filtered = words.filter((w) => w.word !== targetWord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // Async sync if logged in
    if (isLoggedIn()) {
        apiFetch("/words", {
            method: "DELETE",
            body: JSON.stringify({ word: targetWord })
        }).catch(err => console.error("Sync error:", err));
    }
}

export async function syncWordsWithCloud(): Promise<void> {
    if (!isLoggedIn()) return;

    try {
        // 1. Pull latest words from cloud (DB is the source of truth)
        const cloudWords: Word[] = await apiFetch("/words");

        // 2. Update local storage with cloud data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudWords));
        console.log(`Sync success: ${cloudWords.length} words from cloud`);
    } catch (err: any) {
        if (err.message.includes("401") || err.message.includes("Bukan akses berizin")) {
            // User probably deleted from DB, clear local data to "follow the DB"
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(PROFILE_KEY);
            console.warn("Session invalid, local data cleared to sync with DB");
        }
        console.error("Sync words error:", err);
        throw err;
    }
}

const PROFILE_KEY = "kotoflash_profile";

export function getProfile(): UserProfile {
    if (typeof window === "undefined") return { name: "Pengguna Tamu", bio: "Hafalkan kosa katanya, kuasai bahasanya." };
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : { name: "Pengguna Tamu", bio: "Hafalkan kosa katanya, kuasai bahasanya." };
}

export function saveProfile(profile: UserProfile): void {
    try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
        console.error("Failed to save profile to localStorage:", e);
        // If quota exceeded, try saving without avatar as fallback
        if (profile.avatar) {
            const smallProfile = { ...profile, avatar: undefined };
            try {
                localStorage.setItem(PROFILE_KEY, JSON.stringify(smallProfile));
            } catch (e2) {
                console.error("Critical: Could not even save trimmed profile", e2);
            }
        }
    }
}

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
}

export function isLoggedIn(): boolean {
    return !!getToken();
}
