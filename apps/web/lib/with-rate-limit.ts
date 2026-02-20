import { NextRequest, NextResponse } from 'next/server';

import { rateLimit, API_RATE_LIMITS } from './rate-limit';

/**
 * Extract a stable identifier from the incoming request.
 *
 * Priority:
 *  1. `x-forwarded-for` header (set by most reverse-proxies / Vercel)
 *  2. `x-real-ip` header
 *  3. Fallback to `'unknown'` (still rate-limited, just shared bucket)
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Apply rate limiting to an API route handler.
 *
 * Call this at the very top of a route handler. If the caller has exceeded the
 * configured limit, a `NextResponse` with status 429 is returned; otherwise
 * `null` is returned and the handler should continue as normal.
 *
 * @param request  The incoming `NextRequest` (used to derive the client IP).
 * @param options  Optional overrides:
 *   - `tier` – one of the pre-configured tiers from `API_RATE_LIMITS`
 *     (`standard` | `auth` | `webhook` | `email`). Defaults to `'standard'`.
 *   - `prefix` – a string prepended to the rate-limit key so that different
 *     routes maintain independent counters. Defaults to `'api'`.
 *   - `identifier` – explicit identifier to use instead of deriving one from
 *     the request (e.g. a user ID for authenticated rate limits).
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const limited = withRateLimit(request, { tier: 'standard', prefix: 'leads' });
 *   if (limited) return limited;
 *   // … rest of handler
 * }
 * ```
 */
export function withRateLimit(
  request: NextRequest,
  options: {
    tier?: keyof typeof API_RATE_LIMITS;
    prefix?: string;
    identifier?: string;
  } = {},
): NextResponse | null {
  const { tier = 'standard', prefix = 'api', identifier } = options;

  const key = `${prefix}:${identifier ?? getClientIp(request)}`;
  const result = rateLimit(key, API_RATE_LIMITS[tier]);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(
            Math.ceil((result.resetAt - Date.now()) / 1000),
          ),
          'X-RateLimit-Limit': String(API_RATE_LIMITS[tier].maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      },
    );
  }

  return null; // No rate limit hit — continue with handler
}
