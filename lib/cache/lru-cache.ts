/**
 * In-Memory LRU Cache for queries, embeddings, and judge evaluations
 * Eliminates redundant Gemini API calls under heavy hackathon load
 */
export class LRUCache<T = any> {
  private capacity: number;
  private cache: Map<string, { value: T; expiresAt: number }>;
  private defaultTtlMs: number;

  constructor(capacity = 500, defaultTtlMs = 1000 * 60 * 30) {
    this.capacity = capacity;
    this.defaultTtlMs = defaultTtlMs;
    this.cache = new Map();
  }

  get<V = T>(key: string): V | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh position in Map for LRU
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value as unknown as V;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict oldest entry (first key in iteration)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const expiresAt = Date.now() + (ttlMs || this.defaultTtlMs);
    this.cache.set(key, { value, expiresAt });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const lruCache = new LRUCache(1000);
