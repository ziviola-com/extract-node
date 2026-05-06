import { poll } from '@ziviola/sdk-core';
import type { WaitOptions, ZiviolaTransport } from '@ziviola/sdk-core';
import type {
  ExtractJobStatusResponse,
  ExtractJobResult,
} from './types.js';

export class ExtractJobHandle {
  constructor(
    readonly jobId: string,
    private readonly transport: ZiviolaTransport,
  ) {}

  async status(): Promise<ExtractJobStatusResponse> {
    return this.transport.request<ExtractJobStatusResponse>({
      method: 'GET',
      path: `/api/v1/extract/jobs/${this.jobId}`,
    });
  }

  async results(): Promise<ExtractJobResult> {
    return this.transport.request<ExtractJobResult>({
      method: 'GET',
      path: `/api/v1/extract/jobs/${this.jobId}/results`,
    });
  }

  async wait(options?: WaitOptions<ExtractJobStatusResponse>): Promise<ExtractJobResult> {
    await poll(
      () => this.status(),
      'extract',
      options,
    );
    return this.results();
  }

  async cancel(): Promise<void> {
    await this.transport.request<void>({
      method: 'POST',
      path: `/api/v1/extract/jobs/${this.jobId}/cancel`,
    });
  }

  async delete(): Promise<void> {
    await this.transport.request<void>({
      method: 'DELETE',
      path: `/api/v1/extract/jobs/${this.jobId}`,
    });
  }
}
