import { writeFile } from 'node:fs/promises';

export class ExtractResult {
  constructor(
    readonly filename: string | null,
    readonly contentLength: number | null,
    readonly contentType: 'text/markdown' | 'application/json',
    private readonly _buffer: Uint8Array,
  ) {}

  async toFile(path: string): Promise<void> {
    await writeFile(path, this._buffer);
  }

  async toText(): Promise<string> {
    return new TextDecoder().decode(this._buffer);
  }

  async toJson<T = unknown>(): Promise<T> {
    const text = new TextDecoder().decode(this._buffer);
    return JSON.parse(text) as T;
  }

  async toBuffer(): Promise<Uint8Array> {
    return this._buffer;
  }

  /** @internal */
  static async fromResponse(response: Response): Promise<ExtractResult> {
    const contentDisposition = response.headers.get('content-disposition');
    const filename = extractFilename(contentDisposition);
    const contentLength = parseContentLength(response.headers.get('content-length'));
    const rawContentType = response.headers.get('content-type') ?? '';
    const contentType: 'text/markdown' | 'application/json' = rawContentType.includes('json')
      ? 'application/json'
      : 'text/markdown';
    const buffer = new Uint8Array(await response.arrayBuffer());
    return new ExtractResult(filename, contentLength, contentType, buffer);
  }
}

function extractFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
  if (!match || !match[1]) return null;
  return match[1].replace(/['"]/g, '').trim() || null;
}

function parseContentLength(value: string | null): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return isNaN(n) ? null : n;
}
