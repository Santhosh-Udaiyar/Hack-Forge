import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

let genAIInstance: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAIInstance) {
    if (!apiKey) {
      console.warn("[HackForge] GEMINI_API_KEY is not set.");
    }
    genAIInstance = new GoogleGenerativeAI(apiKey || "MOCK_API_KEY");
  }
  return genAIInstance;
}

export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

export const CANDIDATE_CHAT_MODELS = [
  DEFAULT_GEMINI_MODEL,
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
];

let workingChatModel: string | null = null;

export interface GenerateContentParams {
  prompt: string;
  systemInstruction?: string;
  generationConfig?: {
    responseMimeType?: string;
    temperature?: number;
    maxOutputTokens?: number;
  };
}

/**
 * Executes generateContent with automatic multi-model candidate fallback.
 * Automatically tries alternative Gemini models (flash, flash-latest, pro, etc.)
 * if a specific version returns 404 Not Found for the user's API key.
 */
export async function generateContentWithFallback(params: GenerateContentParams): Promise<string> {
  const { prompt, systemInstruction, generationConfig } = params;
  const ai = getGeminiClient();

  const modelsToTry = workingChatModel
    ? [workingChatModel, ...CANDIDATE_CHAT_MODELS.filter((m) => m !== workingChatModel)]
    : CANDIDATE_CHAT_MODELS;

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const modelOptions: any = { model: modelName };
      
      // systemInstruction is supported on gemini-1.5+ models
      if (systemInstruction && !modelName.startsWith("gemini-pro")) {
        modelOptions.systemInstruction = systemInstruction;
      }
      if (generationConfig) {
        modelOptions.generationConfig = generationConfig;
      }

      const model = ai.getGenerativeModel(modelOptions);
      
      const fullPrompt =
        systemInstruction && modelName.startsWith("gemini-pro")
          ? `[SYSTEM INSTRUCTION: ${systemInstruction}]\n\n${prompt}`
          : prompt;

      const result = await model.generateContent(fullPrompt);
      const text = result?.response?.text();
      if (text) {
        workingChatModel = modelName;
        return text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(
        `[HackForge Gemini] Model '${modelName}' returned error (${err?.message || err}). Trying next candidate model...`
      );
    }
  }

  throw lastError || new Error("Failed to generate content with available Gemini models.");
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Execute any Gemini API operation with exponential backoff and jitter
 * Handles 429 (rate limits) and 503 (service unavailable) gracefully.
 */
export async function withGeminiRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 600, maxDelayMs = 8000 } = options;
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (err: any) {
      attempt++;
      const isRateLimit = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("Quota");
      const isUnavailable = err?.status === 503 || err?.message?.includes("503") || err?.message?.includes("ResourceExhausted");
      const isTransient = isRateLimit || isUnavailable || err?.code === "ECONNRESET";

      if (attempt > maxRetries || !isTransient) {
        throw err;
      }

      const jitter = Math.random() * 300;
      const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1) + jitter);
      
      console.warn(
        `[HackForge Gemini] Encountered transient error (${err?.status || "network"}). Retrying attempt ${attempt}/${maxRetries} in ${Math.round(delay)}ms...`
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}
