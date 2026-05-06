export interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  resetAt: Date | null;
}

export interface QuotaInfo {
  limit: number | null;
  remaining: number | null;
  resetAt: Date | null;
}

/**
 * Parse rate-limit and quota information from response headers.
 */
export function parseRateLimitHeaders(headers: Headers | Record<string, string | null>): {
  rateLimit: RateLimitInfo;
  quota: QuotaInfo;
} {
  const get = (name: string): string | null => {
    if (headers instanceof Headers) return headers.get(name);
    return (headers as Record<string, string | null>)[name] ?? null;
  };

  const parseNumber = (value: string | null): number | null => {
    if (value === null) return null;
    const n = Number(value);
    return isNaN(n) ? null : n;
  };

  const parseReset = (value: string | null): Date | null => {
    if (value === null) return null;
    const ts = Number(value);
    if (isNaN(ts)) return null;
    return new Date(ts * 1000);
  };

  return {
    rateLimit: {
      limit: parseNumber(get('x-ratelimit-limit')),
      remaining: parseNumber(get('x-ratelimit-remaining')),
      resetAt: parseReset(get('x-ratelimit-reset')),
    },
    quota: {
      limit: parseNumber(get('x-quota-limit')),
      remaining: parseNumber(get('x-quota-remaining')),
      resetAt: parseReset(get('x-quota-reset')),
    },
  };
}
