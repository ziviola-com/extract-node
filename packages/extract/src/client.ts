import { readFile } from 'node:fs/promises';
import {
  ZiviolaTransport,
  ZiviolaWebhooks,
  fetchUsage,
  validateAuth,
} from '@ziviola/sdk-core';
import type { ZiviolaClientOptions, ProductUsageSummary } from '@ziviola/sdk-core';
import { ExtractResult } from './extract-result.js';
import { ExtractJob } from './extract-job.js';
import { ExtractJobHandle } from './extract-job-handle.js';
import type { ExtractOptions, CreateExtractJobOptions } from './types.js';

const VERSION = '0.1.0';

async function resolveSource(
  source: string | Uint8Array | ReadableStream,
  options: { filename?: string; contentType?: string },
): Promise<{ data: Uint8Array; contentType: string; filename: string }> {
  let data: Uint8Array;
  let filename: string;

  if (typeof source === 'string') {
    data = new Uint8Array(await readFile(source));
    filename = options.filename ?? source.split(/[\\/]/).pop() ?? 'file';
  } else if (source instanceof Uint8Array) {
    data = source;
    filename = options.filename ?? 'file';
  } else {
    const reader = source.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value as Uint8Array);
      totalLength += (value as Uint8Array).length;
    }
    data = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    filename = options.filename ?? 'file';
  }

  const contentType = options.contentType ?? 'application/octet-stream';
  return { data, contentType, filename };
}

export class ZiviolaExtract {
  private readonly transport: ZiviolaTransport;
  readonly webhooks: ZiviolaWebhooks;

  constructor(options?: ZiviolaClientOptions) {
    if (options?.auth) {
      validateAuth(options.auth);
    }

    this.transport = ZiviolaTransport.fromClientOptions(
      options,
      process.env['ZIVIOLA_EXTRACT_API_KEY'],
      'extract',
      'node',
      VERSION,
    );

    this.webhooks = new ZiviolaWebhooks(this.transport, 'extract');
  }

  /**
   * Synchronous single-file document extraction.
   * POST /api/v1/extract/convert (multipart)
   */
  async extract(
    source: string | Uint8Array | ReadableStream,
    options: ExtractOptions = {},
  ): Promise<ExtractResult> {
    const { data, contentType, filename } = await resolveSource(source, options);

    const form = new FormData();
    form.append('file', new Blob([data], { type: contentType }), filename);

    if (options.outputFormat) {
      form.append('outputFormat', options.outputFormat);
    }

    const response = await this.transport.request<Response>({
      method: 'POST',
      path: '/api/v1/extract/convert',
      body: form,
      raw: true,
    });

    return ExtractResult.fromResponse(response);
  }

  /**
   * Create an async extraction job (fluent builder).
   */
  createJob(options?: CreateExtractJobOptions): Promise<ExtractJob> {
    return ExtractJob.create(this.transport, options);
  }

  /**
   * Access a previously created job by ID.
   */
  job(jobId: string): ExtractJobHandle {
    return new ExtractJobHandle(jobId, this.transport);
  }

  /**
   * Current month's Extract usage for the authenticated user.
   */
  async usage(): Promise<ProductUsageSummary> {
    return fetchUsage(this.transport, 'extract');
  }
}
