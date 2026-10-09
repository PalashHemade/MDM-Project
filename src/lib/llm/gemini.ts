const MODEL = "gemini-3.1-flash-lite";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * Calls Gemini asking for a strict JSON response. Returns null on any
 * failure (missing key, network error, bad JSON) so callers can fall back
 * to deterministic behavior instead of crashing the interview flow.
 */
export async function generateJson<T>(systemInstruction: string, userPrompt: string): Promise<T | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_AI_API_KEY is not set — falling back to deterministic behavior.");
    return null;
  }

  try {
    const res = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      }),
    });

    if (!res.ok) {
      console.error("Gemini API error", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") return null;

    return JSON.parse(text) as T;
  } catch (err) {
    console.error("Gemini call failed", err);
    return null;
  }
}
