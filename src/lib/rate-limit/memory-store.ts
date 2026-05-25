interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterMs: number;
  remaining: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

export function createRateLimiter(opts: { limit: number; windowMs: number }): RateLimiter {
  const buckets = new Map<string, Bucket>();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const existing = buckets.get(key);

      if (!existing || existing.resetAt <= now) {
        const fresh: Bucket = { count: 1, resetAt: now + opts.windowMs };
        buckets.set(key, fresh);
        return { ok: true, retryAfterMs: 0, remaining: opts.limit - 1 };
      }

      if (existing.count >= opts.limit) {
        return {
          ok: false,
          retryAfterMs: existing.resetAt - now,
          remaining: 0,
        };
      }

      existing.count += 1;
      return { ok: true, retryAfterMs: 0, remaining: opts.limit - existing.count };
    },
  };
}

export const analyzeRateLimiter = createRateLimiter({
  limit: 20,
  windowMs: 60 * 60 * 1000,
});
