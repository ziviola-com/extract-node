// ─── Main client ───────────────────────────────────────────────────────────────
export { ZiviolaExtract } from './client.js';

// ─── Result class ──────────────────────────────────────────────────────────────
export { ExtractResult } from './extract-result.js';

// ─── Job classes ───────────────────────────────────────────────────────────────
export { ExtractJob } from './extract-job.js';
export { ExtractJobHandle } from './extract-job-handle.js';

// ─── Types ─────────────────────────────────────────────────────────────────────
export type {
  ExtractInputFormat,
  ExtractOutputFormat,
  ExtractOptions,
  CreateExtractJobOptions,
  AttachExtractFileOptions,
  ExtractJobStatus,
  ExtractInputStatus,
  ExtractJobStatusResponse,
  ExtractedDocument,
  ExtractFailedInput,
  ExtractJobResult,
} from './types.js';

// ─── Error classes (re-exported from core) ────────────────────────────────────
export {
  ZiviolaError,
  ApiError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  PayloadTooLargeError,
  InternalServerError,
  TimeoutError,
  ConnectionError,
  JobFailedError,
} from '@ziviola/sdk-core';

// ─── Webhook signature verification ──────────────────────────────────────────
export { verifyWebhookSignature } from '@ziviola/sdk-core';
export type { VerifyWebhookSignatureOptions } from '@ziviola/sdk-core';

// ─── Shared types ─────────────────────────────────────────────────────────────
export type {
  ZiviolaClientOptions,
  ZiviolaAuth,
  WaitOptions,
  ProductUsageSummary,
  WebhookEvent,
  CreateWebhookConfig,
  UpdateWebhookConfig,
  WebhookConfig,
  WebhookWithSecret,
  RotateSecretResponse,
  WebhookTestResponse,
} from '@ziviola/sdk-core';

// ─── Mock client ───────────────────────────────────────────────────────────────
export { MockZiviolaExtract } from './mock.js';
