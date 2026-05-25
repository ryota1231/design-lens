import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRateLimiter } from '@/lib/rate-limit/memory-store';

describe('rate-limit memory-store', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('should allow requests within the limit', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect(limiter.check('ip-1').ok).toBe(true);
    expect(limiter.check('ip-1').ok).toBe(true);
    expect(limiter.check('ip-1').ok).toBe(true);
  });

  it('should block when limit exceeded', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    limiter.check('ip-1');
    limiter.check('ip-1');
    const r = limiter.check('ip-1');
    expect(r.ok).toBe(false);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it('should reset after window expires', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.check('ip-1').ok).toBe(true);
    expect(limiter.check('ip-1').ok).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(limiter.check('ip-1').ok).toBe(true);
  });

  it('should track different keys independently', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.check('ip-1').ok).toBe(true);
    expect(limiter.check('ip-2').ok).toBe(true);
  });
});
