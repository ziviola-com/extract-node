import { ConnectionError, TimeoutError } from './errors.js';

export interface RetryOptions {
  /** Max number of retry attempts. Default: 2 */
  retries: number;
  /** Base delay in ms before first retry. Default: 500 */
  baseDelay?: number;
  /** Exponential factor. Default: 2 */
  factor?: number;
  /** Max delay in ms. Default: 10_000 */
  maxDelay?: number;
}

/**
 * Returns true if the HTTP status code is retryable.
 */
export function isRetryableStatus(status: number): boolean {
  // 429 Too Many Requests, 500–599 except 501 Not Implemented
  return status === 429 || (status >= 500 && status !== 501);
}

/**
 * Returns true if the thrown error should trigger a retry.
 */
export function isRetryableError(err: unknown): boolean {
  return err instanceof ConnectionError || err instanceof TimeoutError;
}

/**
 * Compute exponential back-off delay with jitter.
 * @param attempt 0-indexed attempt number
 */
export function computeDelay(
  attempt: number,
  retryAfterMs: number | null,
  opts: Required<RetryOptions>,
): number {
  if (retryAfterMs !== null) {
    return Math.min(retryAfterMs, opts.maxDelay);
  }
  const base = opts.baseDelay * Math.pow(opts.factor, attempt);
  // Add up to 20% jitter
  const jitter = base * 0.2 * Math.random();
  return Math.min(Math.floor(base + jitter), opts.maxDelay);
}

/**
 * Wraps an async function with retry logic.
 * Non-retryable errors (4xx except 429) are re-thrown immediately.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  isRetryable: (err: unknown) => boolean,
  opts: RetryOptions,
): Promise<T> {
  const resolved: Required<RetryOptions> = {
    retries: opts.retries,
    baseDelay: opts.baseDelay ?? 500,
    factor: opts.factor ?? 2,
    maxDelay: opts.maxDelay ?? 10_000,
  };

  let lastError: unknown;
  for (let attempt = 0; attempt <= resolved.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === resolved.retries) break;
      if (!isRetryable(err)) throw err;

      // Check for Retry-After header on RateLimitError
      let retryAfterMs: number | null = null;
      if (
        typeof err === 'object' &&
        err !== null &&
        'statusCode' in err &&
        (err as { statusCode: number }).statusCode === 429
      ) {
        // Retry-After is in seconds; convert to ms
        const retryAfter = (err as { retryAfter?: number }).retryAfter;
        retryAfterMs = retryAfter != null ? retryAfter * 1000 : null;
      }

      const delay = computeDelay(attempt, retryAfterMs, resolved);
      await sleep(delay);
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
