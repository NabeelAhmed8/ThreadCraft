
export const GEMINI_MODEL_SPECTRUM = [
  "gemini-4-argon",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.0-pro",
  "gemini-pro",
] as const;

export interface GeminiMessagePart {
  text: string;
}

export interface GeminiContentItem {
  role: "user" | "model";
  parts: GeminiMessagePart[];
}

export interface GenerateGeminiOptions {
  systemPrompt: string;
  contents: GeminiContentItem[];
  preferredModel?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateGeminiResult {
  text: string;
  modelUsed: string;
}

export async function generateGeminiContent({
  systemPrompt,
  contents,
  preferredModel,
  temperature = 0.7,
  maxOutputTokens = 1000,
}: GenerateGeminiOptions): Promise<GenerateGeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  const modelsToTry: string[] = [];
  if (preferredModel && !modelsToTry.includes(preferredModel)) {
    modelsToTry.push(preferredModel);
  }
  for (const m of GEMINI_MODEL_SPECTRUM) {
    if (!modelsToTry.includes(m)) {
      modelsToTry.push(m);
    }
  }

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { text, modelUsed: model };
        }
      }

      const errData = await res.json().catch(() => null);
      const errMsg = errData?.error?.message || `HTTP ${res.status}`;
      console.warn(`[Gemini Orchestrator] Model ${model} returned ${res.status} (${errMsg}). Failing over to next version...`);
      lastError = new Error(`Model ${model} failed: ${errMsg}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      console.warn(`[Gemini Orchestrator] Model ${model} network error: ${msg}. Trying next version...`);
      lastError = err instanceof Error ? err : new Error(msg);
    }
  }

  throw lastError || new Error("All Gemini model versions exhausted without success.");
}

