import type { ZiviolaTransport } from './transport.js';

export interface ProductUsageSummary {
  product: 'convert' | 'extract';
  month: string;
  used: number;
  limit: number | null;
  remaining: number | null;
}

interface UsageResponseItem {
  product: string;
  month: string;
  count: number;
  limit: number | null;
}

interface UsageResponse {
  usage: UsageResponseItem[];
}

/**
 * Fetch and normalize usage for a specific product.
 * Maps backend.count → sdk.used and computes sdk.remaining.
 */
export async function fetchUsage(
  transport: ZiviolaTransport,
  product: 'convert' | 'extract',
): Promise<ProductUsageSummary> {
  const response = await transport.request<UsageResponse>({
    method: 'GET',
    path: '/api/v1/auth/usage',
  });

  const item = response.usage.find((u) => u.product === product);
  if (!item) {
    // Return zero usage if no entry for this product
    const now = new Date();
    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
    return { product, month, used: 0, limit: null, remaining: null };
  }

  return {
    product,
    month: item.month,
    used: item.count,
    limit: item.limit,
    remaining: item.limit !== null ? item.limit - item.count : null,
  };
}
