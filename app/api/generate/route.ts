import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { topic, count = 5 } = await req.json();

        const apiKey = process.env.LLM_API_KEY;
        const model = process.env.LLM_MODEL || "llama3.1-8b-instruct";
        const baseURL = process.env.LLM_BASE_URL || "https://api.openai.com/v1";

        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured" }, { status: 500 });
        }

        const prompt = `Generate a list of ${count} vocabulary words related to the topic: "${topic}". 
        Return ONLY a JSON array of objects. Each object must have "word" and "meaning" keys.
        The "meaning" should be in Indonesian.
        Example: [{"word": "apple", "meaning": "apel"}]`;

        const response = await fetch(`${baseURL}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: "You are a helpful assistant that generates vocabulary lists in JSON format." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("LLM Error:", error);
            return NextResponse.json({ error: "Failed to generate words" }, { status: response.status });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Extract JSON from potential Markdown formatting
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return NextResponse.json({ error: "Invalid response format from AI" }, { status: 500 });
        }

        const generatedWords = JSON.parse(jsonMatch[0]);
        return NextResponse.json(generatedWords);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
