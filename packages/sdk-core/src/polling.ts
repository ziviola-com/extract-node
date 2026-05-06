import { JobFailedError, TimeoutError } from './errors.js';

export interface WaitOptions<TStatus> {
  /** Polling interval in ms. Default: 1000, min: 500 */
  pollInterval?: number;
  /** Max wait time in ms. Default: 300_000 (5 min) */
  timeout?: number;
  /** Called on each poll with the current status. */
  onProgress?: (status: TStatus) => void;
}

const TERMINAL_STATUSES = new Set([
  'completed',
  'partial_success',
  'failed',
  'cancelled',
]);

/**
 * Adaptive polling scheduler.
 *
 * Back-off schedule:
 * - Polls 1–5:  pollInterval
 * - Polls 6–15: pollInterval × 1.5
 * - Polls 16+:  pollInterval × 2
 * - Cap:        5000 ms
 */
export async function poll<TStatus extends { status: string; jobId: string; errorMessage?: string }>(
  fetchStatus: () => Promise<TStatus>,
  product: 'convert' | 'extract',
  options: WaitOptions<TStatus> = {},
): Promise<TStatus> {
  const rawInterval = Math.max(options.pollInterval ?? 1000, 500);
  const timeout = options.timeout ?? 300_000;
  const deadline = Date.now() + timeout;

  let pollCount = 0;

  while (true) {
    if (Date.now() >= deadline) {
      throw new TimeoutError(
        `Job polling timed out after ${timeout / 1000}s`,
      );
    }

    const status = await fetchStatus();
    pollCount++;

    options.onProgress?.(status);

    if (TERMINAL_STATUSES.has(status.status)) {
      if (status.status === 'failed') {
        throw new JobFailedError(
          status.jobId,
          product,
          status.errorMessage ?? null,
        );
      }
      return status;
    }

    const interval = computeInterval(pollCount, rawInterval);
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new TimeoutError(
        `Job polling timed out after ${timeout / 1000}s`,
      );
    }

    await sleep(Math.min(interval, remaining));
  }
}

function computeInterval(pollCount: number, base: number): number {
  let interval: number;
  if (pollCount <= 5) {
    interval = base;
  } else if (pollCount <= 15) {
    interval = base * 1.5;
  } else {
    interval = base * 2;
  }
  return Math.min(interval, 5000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
