/**
 * Chain sync store.
 * 同步状态由 ChainSyncService 写入；Controller 只读并调用 syncOnce（SPEC §9、TODO M16、W12）。
 */

import { create } from 'zustand';

export interface ChainSyncStatus {
  isSyncing: boolean;
  chainId: number;
  contractAddress: string;
  lastProcessedBlock: number;
  lastFinalizedBlock: number;
  lastError?: string;
}

export interface ChainSyncState {
  status: ChainSyncStatus | null;
  lastProcessedBlock: number;
  lastError: string | null;
  loading: boolean;
  error: string | null;
}

export interface ChainSyncActions {
  setStatus: (status: ChainSyncStatus | null) => void;
  setLastProcessedBlock: (block: number) => void;
  setLastError: (error: string | null) => void;
  clearError: () => void;
}

const initialState: ChainSyncState = {
  status: null,
  lastProcessedBlock: 0,
  lastError: null,
  loading: false,
  error: null,
};

export const useChainSyncStore = create<ChainSyncState & ChainSyncActions>((set) => ({
  ...initialState,
  setStatus: (status) =>
    set((s) => ({
      status,
      lastProcessedBlock: status?.lastProcessedBlock ?? s.lastProcessedBlock,
      lastError: status?.lastError ?? s.lastError,
    })),
  setLastProcessedBlock: (lastProcessedBlock) => set({ lastProcessedBlock }),
  setLastError: (lastError) => set({ lastError }),
  clearError: () => set({ lastError: null, error: null }),
}));

export const getChainSyncStore = () => useChainSyncStore.getState();
export const setChainSyncStore = useChainSyncStore.setState;
