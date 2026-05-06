import { ZiviolaExtract } from './client.js';
import type { ZiviolaClientOptions } from '@ziviola/sdk-core';

interface MockCall {
  method: string;
  path: string;
  body: unknown;
}

interface MockEntry {
  method: string;
  path: string;
  response: unknown;
}

export class MockZiviolaExtract extends ZiviolaExtract {
  private _calls: MockCall[] = [];
  private _mocks: MockEntry[] = [];

  constructor(options?: ZiviolaClientOptions) {
    super({
      auth: { apiKey: 'mock-api-key' },
      ...options,
    });

    const transport = (this as unknown as { transport: { request: (opts: { method?: string; path: string; body?: unknown }) => unknown } }).transport;
    const originalRequest = transport.request.bind(transport);

    transport.request = async (opts: { method?: string; path: string; body?: unknown }) => {
      const method = opts.method ?? 'GET';
      this._calls.push({ method, path: opts.path, body: opts.body ?? null });

      const mock = this._mocks.find(
        (m) => m.method === method && m.path === opts.path,
      );
      if (mock) {
        this._mocks.splice(this._mocks.indexOf(mock), 1);
        return mock.response;
      }

      return originalRequest(opts);
    };
  }

  mock(method: string, path: string, response: unknown): void {
    this._mocks.push({ method, path, response });
  }

  get calls(): ReadonlyArray<MockCall> {
    return this._calls;
  }

  reset(): void {
    this._calls = [];
    this._mocks = [];
  }
}
