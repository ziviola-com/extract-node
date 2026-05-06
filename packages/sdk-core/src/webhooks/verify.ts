import { createHmac, timingSafeEqual } from 'node:crypto';

export interface VerifyWebhookSignatureOptions {
  /** Raw request body (Buffer or string) */
  payload: string | Buffer;
  /** Value of the X-Webhook-Signature header */
  signature: string | undefined;
  /** The webhook secret */
  secret: string;
  /** Clock tolerance in seconds. Default: 300 */
  tolerance?: number;
}

/**
 * Verify an HMAC-SHA256 webhook signature.
 *
 * Signature format: `t=<unix_timestamp>,v1=<hex_hmac_sha256>`
 * HMAC payload: `{timestamp}.{raw_body}`
 *
 * @returns true if the signature is valid and within the tolerance window
 */
export function verifyWebhookSignature(opts: VerifyWebhookSignatureOptions): boolean {
  const { payload, signature, secret, tolerance = 300 } = opts;

  if (!signature) return false;

  // Parse signature header: t=1234567890,v1=abc123
  const parts: Record<string, string> = {};
  for (const part of signature.split(',')) {
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) continue;
    parts[part.slice(0, eqIndex)] = part.slice(eqIndex + 1);
  }

  const timestampStr = parts['t'];
  const v1 = parts['v1'];

  if (!timestampStr || !v1) return false;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check tolerance
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) return false;

  // Compute expected HMAC
  const rawBody = typeof payload === 'string' ? payload : payload.toString('utf8');
  const hmacPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', secret).update(hmacPayload).digest('hex');

  // Constant-time comparison
  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const actualBuf = Buffer.from(v1, 'hex');
    if (expectedBuf.length !== actualBuf.length) return false;
    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}
