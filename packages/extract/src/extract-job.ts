import { readFile } from 'node:fs/promises';
import { presignedUpload } from '@ziviola/sdk-core';
import type { ZiviolaTransport } from '@ziviola/sdk-core';
import type {
  CreateExtractJobOptions,
  AttachExtractFileOptions,
} from './types.js';
import { ExtractJobHandle } from './extract-job-handle.js';

interface CreateJobResponse {
  jobId: string;
}

export class ExtractJob {
  private readonly inputs: Array<() => Promise<void>> = [];

  constructor(
    private readonly jobId: string,
    private readonly transport: ZiviolaTransport,
    private readonly _options: CreateExtractJobOptions = {},
  ) {}

  /**
   * Attach a file via presigned upload.
   * Note: Extract uses `id` (not `inputId`) as the response field — normalized internally.
   */
  attachFile(
    source: string | Uint8Array | ReadableStream,
    options: AttachExtractFileOptions = {},
  ): ExtractJob {
    this.inputs.push(async () => {
      const { data, contentType, filename } = await resolveSource(source, options);

      // Extract inputs endpoint returns 'id', not 'inputId'
      await presignedUpload(
        {
          inputsUrl: `${this.transport.baseUrl}/api/v1/extract/jobs/${this.jobId}/inputs`,
          inputBody: {
            source: 'upload',
            contentType,
            filename,
            order: options.order ?? 0,
          },
          data,
          contentType,
          responseField: 'id',
          authHeaders: this.transport.getAuthHeaders(),
        },
        fetch,
      );
    });
    return this;
  }

  /** Upload all pending inputs, then start the job. */
  async start(): Promise<ExtractJobHandle> {
    for (const upload of this.inputs) {
      await upload();
    }

    await this.transport.request<void>({
      method: 'POST',
      path: `/api/v1/extract/jobs/${this.jobId}/start`,
    });

    return new ExtractJobHandle(this.jobId, this.transport);
  }

  /** @internal — create a new job via POST /api/v1/extract/jobs */
  static async create(
    transport: ZiviolaTransport,
    options: CreateExtractJobOptions = {},
  ): Promise<ExtractJob> {
    const response = await transport.request<CreateJobResponse>({
      method: 'POST',
      path: '/api/v1/extract/jobs',
      body: options,
    });
    return new ExtractJob(response.jobId, transport, options);
  }
}

async function resolveSource(
  source: string | Uint8Array | ReadableStream,
  options: AttachExtractFileOptions,
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
