// In-memory token-bucket rate limiter. Process-local — fine for single-instance
// Render starter plan. Swap for Redis if you scale to multiple instances.

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, perMinute: number): { ok: boolean; retryAfter: number } {
  if (perMinute <= 0) return { ok: true, retryAfter: 0 };
  const now = Date.now();
  const refillPerMs = perMinute / 60000;
  const bucket = buckets.get(key) ?? { tokens: perMinute, updatedAt: now };
  const elapsed = now - bucket.updatedAt;
  bucket.tokens = Math.min(perMinute, bucket.tokens + elapsed * refillPerMs);
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    const retryAfter = Math.ceil((1 - bucket.tokens) / refillPerMs / 1000);
    return { ok: false, retryAfter };
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { ok: true, retryAfter: 0 };
}

// Periodic cleanup to avoid memory growth.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [k, v] of buckets) if (v.updatedAt < cutoff) buckets.delete(k);
  }, 5 * 60 * 1000).unref?.();
}
