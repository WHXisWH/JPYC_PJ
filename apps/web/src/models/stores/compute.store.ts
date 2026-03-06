/**
 * Compute store.
 * 数据由 ComputeService / ComputeChainService 从 IndexedDB/HTTP 拉取后写入；
 * Controller 只读并调用 Service（SPEC §9、TODO M13）。
 */

import { create } from 'zustand';
import type { ComputeNode, ComputeJob, TaskType } from '../compute.model';

export type TaskFilter = TaskType | 'ALL';

export interface ComputeState {
  nodes: ComputeNode[];
  myJobs: ComputeJob[];
  taskFilter: TaskFilter;
  availableOnly: boolean;
  bookingNodeId: string | null;
  submitting: boolean;
  submitSuccess: boolean;
  loading: boolean;
  error: string | null;
}

export interface ComputeActions {
  setNodes: (nodes: ComputeNode[]) => void;
  setJobs: (jobs: ComputeJob[]) => void;
  setTaskFilter: (taskFilter: TaskFilter) => void;
  setAvailableOnly: (availableOnly: boolean) => void;
  setBookingNodeId: (nodeId: string | null) => void;
  setSubmitting: (submitting: boolean) => void;
  setSubmitSuccess: (submitSuccess: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const initialState: ComputeState = {
  nodes: [],
  myJobs: [],
  taskFilter: 'ALL',
  availableOnly: false,
  bookingNodeId: null,
  submitting: false,
  submitSuccess: false,
  loading: false,
  error: null,
};

export const useComputeStore = create<ComputeState & ComputeActions>((set) => ({
  ...initialState,
  setNodes: (nodes) => set({ nodes, error: null }),
  setJobs: (jobs) => set({ myJobs: jobs, error: null }),
  setTaskFilter: (taskFilter) => set({ taskFilter }),
  setAvailableOnly: (availableOnly) => set({ availableOnly }),
  setBookingNodeId: (bookingNodeId) => set({ bookingNodeId }),
  setSubmitting: (submitting) => set({ submitting }),
  setSubmitSuccess: (submitSuccess) => set({ submitSuccess }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false, submitting: false }),
  clearError: () => set({ error: null }),
}));

export const getComputeStore = () => useComputeStore.getState();
export const setComputeStore = useComputeStore.setState;
