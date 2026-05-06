import type { ZiviolaTransport } from '../transport.js';

export type WebhookEvent = 'job.completed' | 'job.failed' | 'job.partial_success';

export interface CreateWebhookConfig {
  key: string;
  url: string;
  events: WebhookEvent[];
}

export interface UpdateWebhookConfig {
  url?: string;
  enabled?: boolean;
  events?: WebhookEvent[];
}

export interface WebhookConfig {
  webhookId: string;
  key: string;
  url: string;
  events: WebhookEvent[];
  enabled: boolean;
  createdAt: string;
}

export interface WebhookWithSecret extends WebhookConfig {
  secret: string;
}

export interface RotateSecretResponse {
  secret: string;
  message: string;
}

export interface WebhookTestResponse {
  deliveryId: string;
  eventType: string;
}

export interface CanonicalWebhookEnvelope {
  version: '2026-04';
  eventId: string;
  eventType: WebhookEvent;
  product: 'convert' | 'extract';
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Product-scoped webhook management facade.
 * Routes go through /api/v1/auth/webhooks with product injected into create/list calls.
 */
export class ZiviolaWebhooks {
  constructor(
    private readonly transport: ZiviolaTransport,
    private readonly product: 'convert' | 'extract',
  ) {}

  async create(config: CreateWebhookConfig): Promise<WebhookWithSecret> {
    return this.transport.request<WebhookWithSecret>({
      method: 'POST',
      path: '/api/v1/auth/webhooks',
      body: { ...config, product: this.product },
    });
  }

  async list(): Promise<WebhookConfig[]> {
    return this.transport.request<WebhookConfig[]>({
      method: 'GET',
      path: `/api/v1/auth/webhooks?product=${this.product}`,
    });
  }

  async get(key: string): Promise<WebhookConfig> {
    return this.transport.request<WebhookConfig>({
      method: 'GET',
      path: `/api/v1/auth/webhooks/${encodeURIComponent(key)}`,
    });
  }

  async update(key: string, updates: UpdateWebhookConfig): Promise<WebhookConfig> {
    return this.transport.request<WebhookConfig>({
      method: 'PATCH',
      path: `/api/v1/auth/webhooks/${encodeURIComponent(key)}`,
      body: updates,
    });
  }

  async delete(key: string): Promise<void> {
    await this.transport.request<void>({
      method: 'DELETE',
      path: `/api/v1/auth/webhooks/${encodeURIComponent(key)}`,
    });
  }

  async rotateSecret(key: string): Promise<RotateSecretResponse> {
    return this.transport.request<RotateSecretResponse>({
      method: 'POST',
      path: `/api/v1/auth/webhooks/${encodeURIComponent(key)}/rotate-secret`,
    });
  }

  async test(key: string, options: { jobId: string }): Promise<WebhookTestResponse> {
    return this.transport.request<WebhookTestResponse>({
      method: 'POST',
      path: `/api/v1/auth/webhooks/${encodeURIComponent(key)}/test`,
      body: { jobId: options.jobId },
    });
  }
}
