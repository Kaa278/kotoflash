import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DEFAULT_BATCH_SIZE = 5;

const BLACKLIST = [
    "けいざい", "けんきゅう", "せいじ", "ほうりつ", "ぶんがく", "しゅうきょう",
    "てつがく", "じっけん", "ろんぶん", "こうぎ", "せいfu", "けいさつ"
];

function normalizeWord(word: string) {
    return word.toLowerCase().replace(/\(.*?\)/g, "").replace(/\s+/g, "").trim();
}

/**
 * Formats a word according to user preference (kana only, romaji only, or both)
 * Input format: "Hiragana (Romaji)" or "Katakana (Romaji)"
 */
function formatWordByPreference(word: string, preference: "both" | "kana" | "romaji") {
    if (preference === "both") return word;

    // Pattern to match "KANA (ROMAJI)"
    const match = word.match(/^([^\(]+)\s*\(([^\)]+)\)$/);
    if (!match) return word;

    if (preference === "kana") return match[1].trim();
    if (preference === "romaji") return match[2].trim();

    return word;
}

interface Intent {
    topic: string;
    count: number;
    keywords: string[];
    providedWords?: VocabItem[];
    message: string;
    formatPreference: "both" | "kana" | "romaji";
}

interface VocabItem {
    word: string;
    meaning: string;
}

function isConversational(word: string) {
    const norm = normalizeWord(word);
    return !BLACKLIST.some(b => norm.includes(b));
}


/**
 * Extracts intent, count and keywords from user prompt using AI
 */
async function analyzeIntent(apiKey: string, baseURL: string, model: string, prompt: string): Promise<Intent> {
    const systemPrompt = `Anda adalah analis niat (intent analyzer) dan pemroses kosa kata.
Tugas Anda adalah mengekstrak TOPIK, JUMLAH, KATA KUNCI, dan KOSA KATA yang diberikan pengguna (jika ada).
PENTING: Anda harus mengekstrak SEMUA kosa kata yang diberikan pengguna tanpa terkecuali. Jika pengguna memberikan 50 kata, maka 50 kata tersebut harus ada di 'providedWords'. JANGAN melewatkan satu pun.
Untuk 'providedWords', jika user mengetik "たべます (tabemasu) - makan", maka simpan "たべます (tabemasu)" di field "word" secara UTUH. JANGAN pisahkan atau hilangkan bagian dalam kurung.
FORMAT JSON:
{
  "topic": "nama topik tunggal",
  "count": angka_jumlah,
  "keywords": ["keyword1", "keyword2"],
  "providedWords": [{"word": "hiragana (romaji)", "meaning": "arti"}],
  "message": "respon ramah dari Kathlyn",
  "formatPreference": "both | kana | romaji"
}

KETENTUAN IDENTITAS:
1. Nama Anda adalah Kathlyn, asisten belajar bahasa Jepang yang cerdas dan ramah.
2. "message" harus terdengar seperti manusia (bebas/ngobrol), bukan bot.
3. JANGAN hanya mengulang kata kunci (misal: jangan cuma bilang "Ini kata tentang hari"). Berikan konteks atau penyemangat (misal: "Wah, belajar angka dan hari itu dasar yang penting lho! Ini beberapa yang paling sering dipakai...").
4. Gunakan bahasa yang suportif dan sedikit santai (seperti guru privat yang baik).
5. JANGAN gunakan istilah teknis seperti "database", "arsip", "mencari", atau "sistem".
6. Jika pengguna memberikan daftar kata, Kathlyn akan menyapa dengan hangat dan membantu merapikan daftar tersebut.
7. "count" HARUS sama persis dengan JUMLAH kosa kata yang diminta pengguna (misal: "minta 50" -> "count": 50).
8. Jika pengguna meminta format tertentu (misal: "hanya romaji", "jangan pakai hiragana", "pakai kanji/kana saja"), set "formatPreference" sesuai permintaan ("romaji" atau "kana"). Jika tidak ada permintaan khusus, gunakan "both".
9. JANGAN bicara apa pun di luar blok JSON. Output Anda harus valid JSON dan BISA langsung di-parse oleh JSON.parse().`;

    try {
        const response = await fetch(`${baseURL}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey} ` },
            body: JSON.stringify({
                model,
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
                temperature: 0.1,
                max_tokens: 3000,
            }),
        });

        if (!response.ok) return { topic: "umum", count: 10, keywords: [], message: "Maaf, saya sedang kesulitan saat ini. Mari kita coba lagi.", formatPreference: "both" };
        const data = await response.json();
        const content = data.choices[0].message.content;
        console.log("Kathlyn Raw Response:", content);
        const match = content.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("No JSON found in response");
        return JSON.parse(match[0]);
    } catch (e) {
        console.error("Kathlyn Intent Analysis Error:", e);
        return { topic: "umum", count: 10, keywords: [], message: "Sepertinya ada masalah teknis. Coba lagi ya!", formatPreference: "both" };
    }
}


export async function POST(req: Request) {
    try {
        const { prompt: userPrompt } = await req.json();

        const apiKey = process.env.LLM_API_KEY;
        const model = process.env.LLM_MODEL || "llama3-8b-instruct";
        const baseURL = process.env.LLM_BASE_URL || "https://ai.gateway.syi.fan/v1";

        if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

        // 1. ANALYZE INTENT
        const intent = await analyzeIntent(apiKey, baseURL, model, userPrompt);
        const requestedCount = Math.min(intent.count, 100);
        const topic = intent.topic;
        const keywords = intent.keywords.map((k: string) => k.toLowerCase());

        console.log(`Intent Detected: Topic = "${topic}", Count = ${requestedCount}, Keywords = [${keywords.join(", ")}]`);

        const uniqueMap = new Map();

        // 0. EXIT EARLY FOR PURE QUESTIONS
        if (requestedCount === 0) {
            return NextResponse.json({
                words: [],
                message: intent.message
            });
        }

        // 0. PRIORITIZE PROVIDED WORDS (from external input)
        if (intent.providedWords && intent.providedWords.length > 0) {
            intent.providedWords.forEach(item => {
                if (item.word && item.meaning && uniqueMap.size < requestedCount) {
                    uniqueMap.set(normalizeWord(item.word), item);
                }
            });
            console.log(`Provided Words added: ${uniqueMap.size} `);
        }

        // 2. SMART LOCAL SEARCH (90%)
        try {
            const dataPath = path.join(process.cwd(), "data", "vocab.json");
            if (fs.existsSync(dataPath)) {
                const localVocab = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
                if (Array.isArray(localVocab)) {
                    // 100% From DB: AI only for intent/intent-filter
                    const localPullLimit = requestedCount;

                    // Priority 1: Keyword matches
                    const hotMatches = localVocab.filter(item => {
                        const meaning = (item.meaning as string).toLowerCase();
                        return keywords.some((kw: string) => meaning.includes(kw)) && isConversational(item.word);
                    });

                    hotMatches.forEach(item => {
                        if (uniqueMap.size < localPullLimit) {
                            uniqueMap.set(normalizeWord(item.word), item);
                        }
                    });

                    console.log(`Hot Matches found: ${uniqueMap.size} `);

                    // Priority 2: Random fill to reach 100%
                    if (uniqueMap.size < localPullLimit) {
                        const shuffled = localVocab.sort(() => 0.5 - Math.random());
                        for (const item of shuffled) {
                            if (uniqueMap.size >= localPullLimit) break;
                            const key = normalizeWord(item.word);
                            if (!uniqueMap.has(key) && isConversational(item.word)) {
                                uniqueMap.set(key, item);
                            }
                        }
                    }
                }
            }
        } catch (e) { console.error(e); }

        // 3. AI COMPLETION REMOVED (User requested 100% DB)
        // AI remains only for Intent Analysis to get keywords

        // 4. APPLY FORMAT PREFERENCE
        const finalWords = Array.from(uniqueMap.values()).map(item => ({
            ...item,
            word: formatWordByPreference(item.word, intent.formatPreference || "both")
        }));

        return NextResponse.json({
            words: finalWords,
            message: intent.message
        });
    } catch (error) {
        console.error("Critical API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
