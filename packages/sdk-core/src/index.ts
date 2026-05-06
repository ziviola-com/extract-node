// ─── Authentication ────────────────────────────────────────────────────────────
export type { ZiviolaAuth } from './auth.js';
export { validateAuth, getAuthHeaders } from './auth.js';

// ─── Client Options ────────────────────────────────────────────────────────────
export type { ZiviolaClientOptions } from './options.js';
export { DEFAULT_OPTIONS } from './options.js';

// ─── Transport ─────────────────────────────────────────────────────────────────
export { ZiviolaTransport } from './transport.js';
export type { TransportOptions, RequestOptions } from './transport.js';

// ─── Retry ─────────────────────────────────────────────────────────────────────
export { withRetry, isRetryableStatus, isRetryableError, computeDelay } from './retry.js';
export type { RetryOptions } from './retry.js';

// ─── Polling ───────────────────────────────────────────────────────────────────
export { poll } from './polling.js';
export type { WaitOptions } from './polling.js';

// ─── Presigned Upload ──────────────────────────────────────────────────────────
export { presignedUpload } from './upload.js';
export type { PresignedUploadRequest, PresignedUploadResult } from './upload.js';

// ─── Rate Limit ────────────────────────────────────────────────────────────────
export { parseRateLimitHeaders } from './rate-limit.js';
export type { RateLimitInfo, QuotaInfo } from './rate-limit.js';

// ─── Errors ────────────────────────────────────────────────────────────────────
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
  buildApiError,
} from './errors.js';
export type { ApiErrorBody } from './errors.js';

// ─── Webhooks ──────────────────────────────────────────────────────────────────
export { ZiviolaWebhooks } from './webhooks/client.js';
export type {
  WebhookEvent,
  CreateWebhookConfig,
  UpdateWebhookConfig,
  WebhookConfig,
  WebhookWithSecret,
  RotateSecretResponse,
  WebhookTestResponse,
  CanonicalWebhookEnvelope,
} from './webhooks/client.js';
export { verifyWebhookSignature } from './webhooks/verify.js';
export type { VerifyWebhookSignatureOptions } from './webhooks/verify.js';

// ─── Usage ─────────────────────────────────────────────────────────────────────
export { fetchUsage } from './usage.js';
export type { ProductUsageSummary } from './usage.js';
