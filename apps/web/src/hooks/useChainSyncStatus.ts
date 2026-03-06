'use client';

/**
 * useChainSyncStatus: 只读 chainSync.store，暴露 syncOnce（调用 ChainSyncService）（SPEC §8.2、TODO R7）。
 */

import { useCallback } from 'react';
import { useChainSyncStore } from '../stores/chainSync.store';
import { ChainSyncService } from '../services/chainSync.service';

export function useChainSyncStatus() {
  const status = useChainSyncStore((s) => s.status);
  const loading = useChainSyncStore((s) => s.loading);
  const error = useChainSyncStore((s) => s.error);

  const syncOnce = useCallback(() => ChainSyncService.syncOnce(), []);

  return {
    status,
    loading,
    error,
    syncOnce,
  };
}
