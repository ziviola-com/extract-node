import { ConnectionError } from './errors.js';

export interface PresignedUploadRequest {
  /** Body for POST .../inputs */
  inputBody: unknown;
  /** URL to POST to for presigned URL */
  inputsUrl: string;
  /** Binary data to PUT to the presigned URL */
  data: Uint8Array | ReadableStream;
  /** Content-Type of the binary data */
  contentType: string;
  /** Name of the field in the POST response that contains inputId ('inputId' or 'id') */
  responseField: string;
  /** Auth headers to include in POST request */
  authHeaders: Record<string, string>;
  /** Upload timeout in ms. Default: 120_000 */
  uploadTimeout?: number;
}

export interface PresignedUploadResult {
  inputId: string;
  uploadUrl: string;
}

interface PresignedUrlResponse {
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  expiresAt: number;
  [key: string]: unknown;
}

/**
 * Execute the presigned upload choreography:
 * 1. POST to inputsUrl → receive uploadUrl + requiredHeaders
 * 2. PUT binary to uploadUrl with requiredHeaders (120s timeout)
 * 3. On PUT failure, re-request presigned URL and retry once
 *
 * @returns inputId normalized from the product-specific response field
 */
export async function presignedUpload(
  req: PresignedUploadRequest,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<PresignedUploadResult> {
  const uploadTimeout = req.uploadTimeout ?? 120_000;

  // Step 1: Request presigned URL
  const presignedResult = await requestPresignedUrl(
    req.inputsUrl,
    req.inputBody,
    req.authHeaders,
    req.responseField,
    fetchFn,
  );

  // Step 2: PUT binary to presigned URL
  const putSuccess = await putToPresignedUrl(
    presignedResult.uploadUrl,
    presignedResult.requiredHeaders,
    req.data,
    req.contentType,
    uploadTimeout,
    fetchFn,
  );

  if (!putSuccess) {
    // Step 3: Re-request presigned URL and retry once
    const retryPresigned = await requestPresignedUrl(
      req.inputsUrl,
      req.inputBody,
      req.authHeaders,
      req.responseField,
      fetchFn,
    );

    const retrySuccess = await putToPresignedUrl(
      retryPresigned.uploadUrl,
      retryPresigned.requiredHeaders,
      req.data,
      req.contentType,
      uploadTimeout,
      fetchFn,
    );

    if (!retrySuccess) {
      throw new ConnectionError('Presigned upload failed after retry');
    }

    return { inputId: retryPresigned.inputId, uploadUrl: retryPresigned.uploadUrl };
  }

  return { inputId: presignedResult.inputId, uploadUrl: presignedResult.uploadUrl };
}

async function requestPresignedUrl(
  url: string,
  body: unknown,
  authHeaders: Record<string, string>,
  responseField: string,
  fetchFn: typeof fetch,
): Promise<{ inputId: string; uploadUrl: string; requiredHeaders: Record<string, string> }> {
  const response = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ConnectionError(`Failed to request presigned URL: HTTP ${response.status}`);
  }

  const json = await response.json() as PresignedUrlResponse;
  const inputId = String(json[responseField] ?? '');

  return {
    inputId,
    uploadUrl: json.uploadUrl,
    requiredHeaders: json.requiredHeaders ?? {},
  };
}

async function putToPresignedUrl(
  url: string,
  requiredHeaders: Record<string, string>,
  data: Uint8Array | ReadableStream,
  contentType: string,
  timeout: number,
  fetchFn: typeof fetch,
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetchFn(url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          ...requiredHeaders,
        },
        body: data,
        signal: controller.signal,
        // @ts-expect-error - duplex required for streaming in Node 18+
        duplex: 'half',
      });

      return response.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}
