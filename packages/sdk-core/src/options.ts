import type { ZiviolaAuth } from './auth.js';

export interface ZiviolaClientOptions {
  /** Authentication credentials. Defaults to env var fallback. */
  auth?: ZiviolaAuth;
  /** Request timeout in milliseconds. Default: 30_000 */
  timeout?: number;
  /** Number of retries on transient failures. Default: 2 */
  retries?: number;
  /** API base URL. Default: 'https://api.ziviola.com' */
  baseUrl?: string;
  /** Enable debug logging. Default: false */
  debug?: boolean;
}

export const DEFAULT_OPTIONS = {
  timeout: 30_000,
  retries: 2,
  baseUrl: 'https://api.ziviola.com',
  debug: false,
} as const satisfies Required<Omit<ZiviolaClientOptions, 'auth'>>;
