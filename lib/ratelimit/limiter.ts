/**
 * Sliding Window In-Memory Rate Limiter per Team/User
 * Prevents a single team from exhausting the shared Gemini quota.
 */
interface RateLimitRecord {
  timestamps: number[];
}

export class RateLimiter {
  private records: Map<string, RateLimitRecord>;
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 30, windowMs = 60 * 1000) {
    this.records = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    let record = this.records.get(identifier);

    if (!record) {
      record = { timestamps: [] };
      this.records.set(identifier, record);
    }

    // Filter out timestamps older than current window
    record.timestamps = record.timestamps.filter((ts) => now - ts < this.windowMs);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, this.windowMs - (now - oldest));
      return {
        allowed: false,
        remaining: 0,
        resetMs,
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - record.timestamps.length,
      resetMs: this.windowMs,
    };
  }

  reset(identifier: string): void {
    this.records.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter(40, 60 * 1000); // 40 requests / min per team
