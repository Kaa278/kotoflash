import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

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
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
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


export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    });
}

export async function POST(req: Request) {
    try {
        const { prompt: userPrompt } = await req.json();

        const apiKey = process.env.LLM_API_KEY;
        const model = process.env.LLM_MODEL || "llama3-8b-instruct";
        const baseURL = process.env.LLM_BASE_URL || "https://ai.gateway.syi.fan/v1";

        if (!apiKey) return NextResponse.json({ error: "API key not configured" }, {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" }
        });

        // 1. ANALYZE INTENT
        let intent = await analyzeIntent(apiKey, baseURL, model, userPrompt);
        let requestedCount = Math.min(intent.count || 10, 100);
        let topic = intent.topic;
        let keywords = (intent.keywords || []).map((k: string) => k.toLowerCase());
        let isFallback = false;

        // FALLBACK: AI Gateway Maintenance
        if (intent.message.includes("kesulitan") || intent.message.includes("masalah teknis") || intent.message.includes("Gateway Error")) {
            console.log("AI Gateway Error. Entering Maintenance Mode...");
            isFallback = true;
            requestedCount = 0;
            keywords = [];
            intent.message = "Punten! Kathlyn sedang dalam pemeliharaan (Maintenance) sebentar nih. Silakan coba lagi nanti atau hubungi Admin/CS via Telegram kalau ada kendala mendesak ya! 🙏";
        }

        console.log(`Intent Status: ${isFallback ? "FALLBACK" : "OK"} | Topic = "${topic}", Count = ${requestedCount}, Keywords = [${keywords.join(", ")}]`);

        const uniqueMap = new Map();

        // 0. EXIT EARLY FOR PURE QUESTIONS
        if (requestedCount === 0) {
            return NextResponse.json({
                words: [],
                message: intent.message
            }, { headers: { "Access-Control-Allow-Origin": "*" } });
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

        // 2. SMART DATABASE SEARCH (90%)
        try {
            // Find words matching any of the keywords in meaning or word
            if (keywords.length > 0) {
                const likeConditions = keywords.map(() => "(meaning LIKE ? OR word LIKE ?)").join(" OR ");
                const params = keywords.flatMap(kw => [`%${kw}%`, `%${kw}%`]);

                const [hotMatches]: any = await pool.execute(
                    `SELECT word, meaning FROM master_vocab WHERE ${likeConditions}`,
                    params
                );

                hotMatches.forEach((item: any) => {
                    if (uniqueMap.size < requestedCount) {
                        if (isConversational(item.word)) {
                            uniqueMap.set(normalizeWord(item.word), item);
                        }
                    }
                });
                console.log(`Hot Matches found in DB: ${uniqueMap.size}`);
            }

            // Priority 2: Random fill to reach requestedCount
            // Only random fill if NOT in fallback mode (to avoid random words for "hallo")
            // OR if some matches were already found (implying intent for vocab)
            if (uniqueMap.size < requestedCount && (!isFallback || uniqueMap.size > 0)) {
                const [randomRows]: any = await pool.execute(
                    `SELECT word, meaning FROM master_vocab ORDER BY RAND() LIMIT ?`,
                    [requestedCount * 2] // Pull extra to skip conversational blacklist/duplicates
                );

                for (const item of randomRows) {
                    if (uniqueMap.size >= requestedCount) break;
                    const key = normalizeWord(item.word);
                    if (!uniqueMap.has(key) && isConversational(item.word)) {
                        uniqueMap.set(key, item);
                    }
                }
                console.log(`Total words after random fill: ${uniqueMap.size}`);
            }
        } catch (e) {
            console.error("DB Vocab Search Error:", e);
        }

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
        }, {
            headers: {
                "Access-Control-Allow-Origin": "*",
            }
        });
    } catch (error) {
        console.error("Critical API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    }
}
