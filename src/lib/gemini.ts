/**
 * Gemini Multi-Model Orchestrator
 * Single Responsibility: Manages communication with Gemini API with multi-model fallback
 * spanning from Gemini 4 Argon down to Gemini 1.0 legacy versions.
 */

export const GEMINI_MODEL_SPECTRUM = [
  // 1. Next-Gen Frontier Tier
  "gemini-4-argon",
  // 2. Gemini 3 Series
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  // 3. Dynamic Latest Tier
  "gemini-flash-latest",
  "gemini-pro-latest",
  // 4. Gemini 2.5 Series
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  // 5. Gemini 1.5 Series
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  // 6. Gemini 1.0 Legacy Tier
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

/**
 * Executes content generation trying models in prioritized order.
 * If a model hits quota limits (429), deprecation (404), or timeout,
 * it seamlessly transitions to the next available version in the spectrum.
 */
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

  // Build model priority queue
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

      // If status is 429, 404, or 503, log and smoothly try next model
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

