/**
 * Authentication credentials for Ziviola SDK.
 *
 * Provide either `apiKey` (for API key auth) or `accessToken` (for JWT auth).
 * Providing both is a configuration error and will throw at construction time.
 */
export type ZiviolaAuth =
  | { apiKey: string }
  | { accessToken: string };

/**
 * Validates that exactly one credential type is provided.
 * Throws if both apiKey and accessToken are present simultaneously.
 */
export function validateAuth(auth: ZiviolaAuth): void {
  if ('apiKey' in auth && 'accessToken' in auth) {
    throw new Error(
      'ZiviolaAuth must specify either apiKey or accessToken, not both.',
    );
  }
}

/**
 * Returns the HTTP auth header value for the given credentials.
 */
export function getAuthHeaders(auth: ZiviolaAuth): Record<string, string> {
  if ('apiKey' in auth) {
    return { 'x-api-key': auth.apiKey };
  }
  return { Authorization: `Bearer ${auth.accessToken}` };
}
