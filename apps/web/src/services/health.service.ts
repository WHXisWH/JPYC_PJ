/**
 * HealthService: health check（薄 Service，供 HealthBadge/Header 使用；SPEC V7）.
 */

import type { NodeStayClient } from '@nodestay/api-client';
import { createNodeStayClient } from './nodestay';

export const HealthService = {
  async check(client?: NodeStayClient): Promise<{ ok: true }> {
    const c = client ?? createNodeStayClient();
    return await c.health();
  },
};
