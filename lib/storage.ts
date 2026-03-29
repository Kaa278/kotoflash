export type Word = {
    id: string;
    word: string;
    meaning: string;
    example?: string;
    createdAt: number;
};

export type UserProfile = {
    name: string;
    bio: string;
    avatar?: string; // Base64 or URL
};

const STORAGE_KEY = "kotoflash_words";

export function getWords(): Word[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveWord(word: Omit<Word, "id" | "createdAt">): Word {
    const words = getWords();
    const newWord: Word = {
        ...word,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
    };
    words.push(newWord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    return newWord;
}

export function saveWords(words: Word[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

export function updateWord(id: string, updates: Partial<Word>): void {
    const words = getWords();
    const index = words.findIndex((w) => w.id === id);
    if (index !== -1) {
        words[index] = { ...words[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    }
}

export function deleteWord(id: string): void {
    const words = getWords();
    const filtered = words.filter((w) => w.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

const PROFILE_KEY = "kotoflash_profile";

export function getProfile(): UserProfile {
    if (typeof window === "undefined") return { name: "Pengguna Tamu", bio: "Hafalkan kosa katanya, kuasai bahasanya." };
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : { name: "Pengguna Tamu", bio: "Hafalkan kosa katanya, kuasai bahasanya." };
}

export function saveProfile(profile: UserProfile): void {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
