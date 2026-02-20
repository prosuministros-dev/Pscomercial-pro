interface RateLimitConfig {
  interval: number; // Time window in ms
  maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60_000);

export function rateLimit(
  key: string,
  config: RateLimitConfig = { interval: 60_000, maxRequests: 100 },
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    const newEntry = { count: 1, resetAt: now + config.interval };
    rateLimitMap.set(key, newEntry);
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Pre-configured limiters
export const API_RATE_LIMITS = {
  standard: { interval: 60_000, maxRequests: 100 },
  auth: { interval: 60_000, maxRequests: 10 },
  webhook: { interval: 60_000, maxRequests: 200 },
  email: { interval: 60_000, maxRequests: 20 },
} as const;
