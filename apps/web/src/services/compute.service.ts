/**
 * ComputeService: HTTP 编排 submitJob、cancelJob、getJobResult（S7）.
 * 拉取/提交后写入 compute.store。链上权威数据由 ComputeChainService 从 IndexedDB 写入（见 W11）.
 */

import type { NodeStayClient } from '@nodestay/api-client';
import type { ComputeNode, ComputeJob, SubmitJobInput } from '../models/compute.model';
import { setComputeStore, getComputeStore } from '../stores/compute.store';
import type { TaskFilter } from '../stores/compute.store';
import { createNodeStayClient } from './nodestay';

/** Map API node item to app ComputeNode (minimal; IndexedDB/Chain fills rest) */
function toComputeNode(item: {
  nodeId: string;
  venueId: string;
  seatId: string;
  status: string;
  pricePerHourMinor: number;
}): ComputeNode {
  return {
    nodeId: item.nodeId,
    venueId: item.venueId,
    seatId: item.seatId,
    status: item.status as ComputeNode['status'],
    pricePerHourMinor: item.pricePerHourMinor,
    specs: { cpuModel: '', cpuCores: 0, gpuModel: '', vram: 0, ram: 0 },
    minBookingHours: 1,
    maxBookingHours: 24,
    supportedTasks: ['GENERAL'],
  };
}

export const ComputeService = {
  setTaskFilter(taskFilter: TaskFilter) {
    setComputeStore({ taskFilter });
  },
  setAvailableOnly(availableOnly: boolean) {
    setComputeStore({ availableOnly });
  },
  openBooking(nodeId: string) {
    setComputeStore({ bookingNodeId: nodeId });
  },
  closeBooking() {
    setComputeStore({ bookingNodeId: null });
  },

  async refresh(client?: NodeStayClient): Promise<void> {
    await this.listNodesFromHttp(client);
    // myJobs: 将来は IndexedDB/API から取得
    setComputeStore({ myJobs: getComputeStore().myJobs });
  },

  async listNodesFromHttp(client?: NodeStayClient): Promise<ComputeNode[]> {
    const c = client ?? createNodeStayClient();
    setComputeStore({ loading: true, error: null });
    try {
      const data = await c.listComputeNodes();
      const nodes = data.map(toComputeNode);
      setComputeStore({ nodes, loading: false, error: null });
      return nodes;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load nodes';
      setComputeStore({ loading: false, error: msg });
      throw e;
    }
  },

  async submitJob(
    params: SubmitJobInput & { requesterId?: string },
    client?: NodeStayClient
  ): Promise<{ jobId: string }> {
    const c = client ?? createNodeStayClient();
    const { bookingNodeId } = getComputeStore();
    setComputeStore({ submitting: true, error: null });
    try {
      const res = await c.submitComputeJob({
        requesterId: params.requesterId ?? 'current-user',
        taskType: params.taskType,
        taskSpec: params.taskSpec ?? { command: '', inputUri: '', outputUri: '' },
      });
      setComputeStore({ submitting: false, submitSuccess: true, bookingNodeId: null });
      setTimeout(() => setComputeStore({ submitSuccess: false }), 5000);
      return { jobId: res.jobId };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Submit job failed';
      setComputeStore({ submitting: false, error: msg });
      throw e;
    }
  },

  async cancelJob(jobId: string, client?: NodeStayClient): Promise<void> {
    const c = client ?? createNodeStayClient();
    try {
      await c.cancelComputeJob(jobId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Cancel job failed';
      setComputeStore((s) => ({ ...s, error: msg }));
      throw e;
    }
  },

  async getJobResult(jobId: string, client?: NodeStayClient): Promise<{ jobId: string; resultUri: string | null }> {
    const c = client ?? createNodeStayClient();
    return await c.getComputeJobResult(jobId);
  },
};
