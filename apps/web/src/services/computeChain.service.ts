/**
 * ComputeChainService: 从 IndexedDB 拉取链上 nodes/jobs 并写入 compute.store（W11）.
 * Stub until IndexedDB indexer is implemented; then replace with real IndexedDB query.
 */

import type { ComputeNode, ComputeJob } from '../models/compute.model';

export const ComputeChainService = {
  async listNodes(): Promise<ComputeNode[]> {
    // Stub: IndexedDB not ready (W11). When ready: read from IndexedDB and setComputeStore({ nodes, ... }).
    return [];
  },

  async listMyJobs(_requesterAddress: string): Promise<ComputeJob[]> {
    // Stub: IndexedDB not ready (W11).
    return [];
  },
};
