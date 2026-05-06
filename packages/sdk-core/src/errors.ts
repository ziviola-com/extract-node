// ─── Base Error ───────────────────────────────────────────────────────────────

export class ZiviolaError extends Error {
  override readonly name: string = 'ZiviolaError';

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── API Error ────────────────────────────────────────────────────────────────

export class ApiError extends ZiviolaError {
  override readonly name: string = 'ApiError';

  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string | null = null,
    readonly details: Record<string, unknown> | null = null,
    readonly requestId: string | null = null,
    options?: ErrorOptions,
  ) {
    super(message, options);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── HTTP Status Errors ───────────────────────────────────────────────────────

export class AuthenticationError extends ApiError {
  override readonly name = 'AuthenticationError';
}

export class ForbiddenError extends ApiError {
  override readonly name = 'ForbiddenError';
}

export class NotFoundError extends ApiError {
  override readonly name = 'NotFoundError';
}

export class ValidationError extends ApiError {
  override readonly name = 'ValidationError';
}

export class RateLimitError extends ApiError {
  override readonly name = 'RateLimitError';

  constructor(
    message: string,
    statusCode: number,
    code: string | null,
    details: Record<string, unknown> | null,
    requestId: string | null,
    readonly limit: number | null,
    readonly remaining: number | null,
    readonly resetAt: Date | null,
  ) {
    super(message, statusCode, code, details, requestId);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PayloadTooLargeError extends ApiError {
  override readonly name = 'PayloadTooLargeError';
}

export class InternalServerError extends ApiError {
  override readonly name = 'InternalServerError';
}

// ─── Non-HTTP Errors ─────────────────────────────────────────────────────────

export class TimeoutError extends ZiviolaError {
  override readonly name = 'TimeoutError';
}

export class ConnectionError extends ZiviolaError {
  override readonly name = 'ConnectionError';
}

export class JobFailedError extends ZiviolaError {
  override readonly name = 'JobFailedError';

  constructor(
    readonly jobId: string,
    readonly product: 'convert' | 'extract',
    readonly errorMessage: string | null,
  ) {
    super(
      `Job ${jobId} failed${errorMessage ? `: ${errorMessage}` : ''}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── HTTP error code → SDK error class mapping ───────────────────────────────

const CONVERT_ERROR_CODE_MAP: Record<string, typeof ValidationError | typeof ForbiddenError | typeof NotFoundError | typeof PayloadTooLargeError> = {
  INVALID_INPUT: ValidationError,
  INSUFFICIENT_INPUTS: ValidationError,
  INCOMPLETE_UPLOADS: ValidationError,
  INPUT_LIMIT_EXCEEDED: ValidationError,
  UNSUPPORTED_FILE_TYPE: ValidationError,
  AMBIGUOUS_FILE_TYPE: ValidationError,
  INVALID_STATE_TRANSITION: ValidationError,
  PAYLOAD_TOO_LARGE: PayloadTooLargeError,
  DOWNLOAD_UNAUTHORIZED: ForbiddenError,
  DOWNLOAD_TOKEN_EXPIRED: ForbiddenError,
  JOB_NOT_FOUND: NotFoundError,
};

export interface ApiErrorBody {
  message?: string;
  code?: string | null;
  details?: Record<string, unknown> | null;
  requestId?: string | null;
  error?: string;
}

/**
 * Build the correct SDK error class from an HTTP response + parsed body.
 */
export function buildApiError(
  statusCode: number,
  body: ApiErrorBody,
  rateLimitInfo?: { limit: number | null; remaining: number | null; resetAt: Date | null },
): ApiError {
  const message = body.message ?? body.error ?? `HTTP ${statusCode}`;
  const code = body.code ?? null;
  const details = body.details ?? null;
  const requestId = body.requestId ?? null;

  // Check domain-specific error code mapping
  if (code && code in CONVERT_ERROR_CODE_MAP) {
    const ErrorClass = CONVERT_ERROR_CODE_MAP[code]!;
    return new ErrorClass(message, statusCode, code, details, requestId);
  }

  switch (statusCode) {
    case 400:
    case 422:
      return new ValidationError(message, statusCode, code, details, requestId);
    case 401:
      return new AuthenticationError(message, statusCode, code, details, requestId);
    case 403:
      return new ForbiddenError(message, statusCode, code, details, requestId);
    case 404:
      return new NotFoundError(message, statusCode, code, details, requestId);
    case 413:
      return new PayloadTooLargeError(message, statusCode, code, details, requestId);
    case 429:
      return new RateLimitError(
        message, statusCode, code, details, requestId,
        rateLimitInfo?.limit ?? null,
        rateLimitInfo?.remaining ?? null,
        rateLimitInfo?.resetAt ?? null,
      );
    case 500:
      return new InternalServerError(message, statusCode, code, details, requestId);
    default:
      if (statusCode >= 500) {
        return new InternalServerError(message, statusCode, code, details, requestId);
      }
      return new ApiError(message, statusCode, code, details, requestId);
  }
}
