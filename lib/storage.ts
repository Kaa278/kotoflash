export type Word = {
    word: string;
    meaning: string;
    example?: string;
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

export function saveWord(word: Word): Word {
    const words = getWords();
    const existingIndex = words.findIndex(w => w.word === word.word);

    if (existingIndex !== -1) {
        words[existingIndex] = { ...words[existingIndex], ...word };
    } else {
        words.push(word);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
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
    }
}

export function deleteWord(targetWord: string): void {
    const words = getWords();
    const filtered = words.filter((w) => w.word !== targetWord);
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
