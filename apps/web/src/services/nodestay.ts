import { NodeStayClient } from '@nodestay/api-client';
import { getApiBaseUrl } from './config';

export function createNodeStayClient() {
  return new NodeStayClient({ baseUrl: getApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL) });
}

