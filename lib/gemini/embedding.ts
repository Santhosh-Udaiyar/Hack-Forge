import { getGeminiClient, withGeminiRetry } from "./client";
import { lruCache } from "../cache/lru-cache";

// Fixed output dimensionality for 768-dim pgvector HNSW index
export const EMBEDDING_DIMENSION = 768;
export const DEFAULT_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

const CANDIDATE_EMBEDDING_MODELS = [
  DEFAULT_EMBEDDING_MODEL,
  "gemini-embedding-001",
  "gemini-embedding-2",
  "gemini-embedding-2-preview",
  "models/gemini-embedding-001",
  "models/gemini-embedding-2",
];

let workingModel: string | null = null;

async function embedWithFallback(text: string): Promise<number[]> {
  const ai = getGeminiClient();
  const modelsToTry = workingModel
    ? [workingModel, ...CANDIDATE_EMBEDDING_MODELS.filter((m) => m !== workingModel)]
    : CANDIDATE_EMBEDDING_MODELS;

  for (const modelName of modelsToTry) {
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      let result: any = null;
      try {
        result = await (model as any).embedContent({
          content: { parts: [{ text }] },
          outputDimensionality: EMBEDDING_DIMENSION,
        });
      } catch {
        result = await model.embedContent(text);
      }

      if (result?.embedding?.values && result.embedding.values.length > 0) {
        workingModel = modelName;
        return normalizeVector(result.embedding.values, EMBEDDING_DIMENSION);
      }
    } catch (err: any) {
      console.warn(
        `[HackForge Embedding] Model '${modelName}' returned error (${err?.message || err}). Trying next candidate...`
      );
    }
  }

  // Graceful fallback to deterministic high-entropy vector if no remote embedding model responds
  return generateDeterministicVector(text, EMBEDDING_DIMENSION);
}

/**
 * Generate a 768-dimensional embedding for a single text query with in-memory caching and retry
 */
export async function getQueryEmbedding(text: string): Promise<number[]> {
  const cacheKey = `embed:${text.trim().toLowerCase()}`;
  const cached = lruCache.get<number[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    const mockVector = generateDeterministicVector(text, EMBEDDING_DIMENSION);
    lruCache.set(cacheKey, mockVector);
    return mockVector;
  }

  try {
    const vector = await withGeminiRetry(async () => {
      return await embedWithFallback(text);
    });
    lruCache.set(cacheKey, vector);
    return vector;
  } catch (err) {
    console.warn("[HackForge Embedding] Remote embedding failed, using deterministic vector fallback:", err);
    const fallbackVector = generateDeterministicVector(text, EMBEDDING_DIMENSION);
    lruCache.set(cacheKey, fallbackVector);
    return fallbackVector;
  }
}

/**
 * Generate embeddings for an array of document chunks in batches of 16 to avoid payload limits
 */
export async function getBatchEmbeddings(chunks: string[]): Promise<number[][]> {
  const batchSize = 16;
  const allEmbeddings: number[][] = [];
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    if (!apiKey) {
      for (const text of batch) {
        allEmbeddings.push(generateDeterministicVector(text, EMBEDDING_DIMENSION));
      }
      continue;
    }

    try {
      const batchVectors = await withGeminiRetry(async () => {
        const promises = batch.map(async (chunk) => {
          const cacheKey = `embed:${chunk.trim().toLowerCase()}`;
          const cached = lruCache.get<number[]>(cacheKey);
          if (cached) return cached;

          const norm = await embedWithFallback(chunk);
          lruCache.set(cacheKey, norm);
          return norm;
        });

        return await Promise.all(promises);
      });

      allEmbeddings.push(...batchVectors);
    } catch (err) {
      console.warn("[HackForge Embedding] Batch embedding fallback to deterministic vectors:", err);
      for (const text of batch) {
        const fallback = generateDeterministicVector(text, EMBEDDING_DIMENSION);
        allEmbeddings.push(fallback);
      }
    }
  }

  return allEmbeddings;
}

function normalizeVector(vector: number[], targetDim: number): number[] {
  if (vector.length === targetDim) return vector;
  if (vector.length > targetDim) return vector.slice(0, targetDim);
  const padded = [...vector];
  while (padded.length < targetDim) padded.push(0);
  return padded;
}

function generateDeterministicVector(text: string, dim: number): number[] {
  const vec: number[] = new Array(dim).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < dim; i++) {
    const v = Math.sin(hash + i * 0.137);
    vec[i] = Math.round(v * 10000) / 10000;
  }
  // Normalize vector to unit length
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map((v) => v / (norm || 1));
}
