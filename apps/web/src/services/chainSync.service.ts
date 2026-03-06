/**
 * ChainSyncService: start/stop/syncOnce/status; 同步状态写入 chainSync.store（S10, W12）.
 * Stub until Indexer is implemented; then wire to real indexer.
 */

import type { ChainSyncStatus } from '../stores/chainSync.store';
import { getChainSyncStore, setChainSyncStore } from '../stores/chainSync.store';

export const ChainSyncService = {
  async start(): Promise<void> {
    // Stub: when Indexer ready, start background sync.
    setChainSyncStore({ status: null, loading: false, error: null });
  },

  async stop(): Promise<void> {
    setChainSyncStore({ status: null });
  },

  async syncOnce(): Promise<void> {
    setChainSyncStore({ loading: true, error: null });
    try {
      // Stub: no indexer yet. When ready: run one sync cycle and set status.
      setChainSyncStore({
        status: {
          chainId: 0,
          contractAddress: '',
          lastProcessedBlock: 0,
          lastFinalizedBlock: 0,
          isSyncing: false,
        },
        loading: false,
      });
    } catch (e) {
      setChainSyncStore({
        loading: false,
        error: e instanceof Error ? e.message : 'Sync failed',
      });
      throw e;
    }
  },

  async status(): Promise<ChainSyncStatus | null> {
    return getChainSyncStore().status ?? null;
  },
};
