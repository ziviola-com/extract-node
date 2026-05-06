import { getAuthHeaders, type ZiviolaAuth } from './auth.js';
import { buildApiError, ConnectionError, TimeoutError, type ApiErrorBody } from './errors.js';
import { parseRateLimitHeaders } from './rate-limit.js';
import { withRetry, isRetryableStatus, isRetryableError } from './retry.js';
import type { ZiviolaClientOptions } from './options.js';
import { DEFAULT_OPTIONS } from './options.js';

export interface TransportOptions {
  auth: ZiviolaAuth;
  baseUrl: string;
  timeout: number;
  retries: number;
  userAgent: string;
  debug: boolean;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** If true, do not parse body as JSON — return raw Response */
  raw?: boolean;
  /** If true, skip retry logic (e.g. presigned PUT) */
  noRetry?: boolean;
}

export class ZiviolaTransport {
  private readonly authHeaders: Record<string, string>;

  constructor(private readonly opts: TransportOptions) {
    this.authHeaders = getAuthHeaders(opts.auth);
  }

  get baseUrl(): string {
    return this.opts.baseUrl;
  }

  getAuthHeaders(): Record<string, string> {
    return this.authHeaders;
  }

  async request<T = unknown>(reqOpts: RequestOptions): Promise<T> {
    const execute = async (): Promise<T> => {
      const url = `${this.opts.baseUrl}${reqOpts.path}`;
      const method = reqOpts.method ?? 'GET';

      const headers: Record<string, string> = {
        'User-Agent': this.opts.userAgent,
        ...this.authHeaders,
        ...reqOpts.headers,
      };

      let bodyInit: BodyInit | undefined;
      if (reqOpts.body !== undefined) {
        if (reqOpts.body instanceof FormData) {
          bodyInit = reqOpts.body;
        } else if (reqOpts.body instanceof Uint8Array || reqOpts.body instanceof ReadableStream) {
          bodyInit = reqOpts.body as BodyInit;
        } else {
          headers['Content-Type'] = 'application/json';
          bodyInit = JSON.stringify(reqOpts.body);
        }
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort('timeout'), this.opts.timeout);

      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers,
          body: bodyInit,
          signal: controller.signal,
        });
      } catch (err) {
        if (
          err instanceof Error &&
          (err.name === 'AbortError' || (err as NodeJS.ErrnoException).code === 'UND_ERR_CONNECT_TIMEOUT')
        ) {
          throw new TimeoutError(`Request timed out after ${this.opts.timeout}ms`);
        }
        throw new ConnectionError(
          `Network error: ${err instanceof Error ? err.message : String(err)}`,
          { cause: err },
        );
      } finally {
        clearTimeout(timer);
      }

      if (this.opts.debug) {
        console.debug(`[ziviola] ${method} ${url} → ${response.status}`);
      }

      const { rateLimit } = parseRateLimitHeaders(response.headers);

      if (!response.ok) {
        let errorBody: ApiErrorBody = {};
        try {
          errorBody = await response.json() as ApiErrorBody;
        } catch {
          // Ignore parse errors
        }
        throw buildApiError(response.status, errorBody, rateLimit);
      }

      if (reqOpts.raw) {
        return response as unknown as T;
      }

      if (response.status === 204) {
        return undefined as unknown as T;
      }

      const text = await response.text();
      if (!text) return undefined as unknown as T;

      return JSON.parse(text) as T;
    };

    if (reqOpts.noRetry) {
      return execute();
    }

    return withRetry(
      execute,
      (err) => {
        if (isRetryableError(err)) return true;
        if (
          typeof err === 'object' &&
          err !== null &&
          'statusCode' in err
        ) {
          return isRetryableStatus((err as { statusCode: number }).statusCode);
        }
        return false;
      },
      { retries: this.opts.retries },
    );
  }

  /**
   * Build a ZiviolaTransport from client options + product info.
   */
  static fromClientOptions(
    options: ZiviolaClientOptions | undefined,
    envApiKey: string | undefined,
    product: string,
    lang: string,
    version: string,
  ): ZiviolaTransport {
    const timeout = options?.timeout ?? DEFAULT_OPTIONS.timeout;
    const retries = options?.retries ?? DEFAULT_OPTIONS.retries;
    const baseUrl = options?.baseUrl ?? DEFAULT_OPTIONS.baseUrl;
    const debug = options?.debug ?? DEFAULT_OPTIONS.debug;

    let auth = options?.auth;
    if (!auth) {
      if (!envApiKey) {
        throw new Error(
          `No auth credentials provided and no ${product.toUpperCase()}_API_KEY environment variable found.`,
        );
      }
      auth = { apiKey: envApiKey };
    }

    return new ZiviolaTransport({
      auth,
      baseUrl,
      timeout,
      retries,
      userAgent: `ziviola-${product}-${lang}/${version}`,
      debug,
    });
  }
}
