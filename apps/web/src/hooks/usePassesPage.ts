/**
 * usePassesPage: マイパス Controller（SPEC §8）。
 * パス一覧・フィルター・QR モーダル状態を保持；View は表示とクリックで Hook の handler を呼ぶ。
 */

import { useMemo, useState } from 'react';

export type PassStatus = 'ACTIVE' | 'IN_USE' | 'CONSUMED' | 'EXPIRED' | 'TRANSFERRED' | 'PENDING';

export interface Pass {
  passId: string;
  planName: string;
  venueName: string;
  status: PassStatus;
  remainingMinutes: number;
  expiresAt: string;
  depositAmountMinor: number;
  depositStatus: 'NONE' | 'HELD' | 'PARTIALLY_CAPTURED' | 'RELEASED';
  transferable: boolean;
}

const MOCK_PASSES: Pass[] = [
  {
    passId: 'pass-001',
    planName: '3時間パック',
    venueName: '快適ネットカフェ 渋谷店',
    status: 'ACTIVE',
    remainingMinutes: 180,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    depositAmountMinor: 50000,
    depositStatus: 'NONE',
    transferable: true,
  },
  {
    passId: 'pass-002',
    planName: 'ナイトパック',
    venueName: 'ネットカフェ新宿西口店',
    status: 'IN_USE',
    remainingMinutes: 240,
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    depositAmountMinor: 80000,
    depositStatus: 'HELD',
    transferable: false,
  },
  {
    passId: 'pass-003',
    planName: '6時間パック',
    venueName: '快適ネットカフェ 池袋店',
    status: 'CONSUMED',
    remainingMinutes: 0,
    expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    depositAmountMinor: 0,
    depositStatus: 'RELEASED',
    transferable: false,
  },
  {
    passId: 'pass-004',
    planName: '3時間パック',
    venueName: '電脳空間カフェ 秋葉原店',
    status: 'EXPIRED',
    remainingMinutes: 60,
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    depositAmountMinor: 0,
    depositStatus: 'NONE',
    transferable: false,
  },
];

export type PassFilterKey = 'all' | 'active' | 'history';

export interface UsePassesPageReturn {
  filtered: Pass[];
  activeFilter: PassFilterKey;
  setActiveFilter: (k: PassFilterKey) => void;
  activeCount: number;
  qrPass: Pass | null;
  setQrPass: (p: Pass | null) => void;
}

export function usePassesPage(): UsePassesPageReturn {
  const [activeFilter, setActiveFilter] = useState<PassFilterKey>('active');
  const [qrPass, setQrPass] = useState<Pass | null>(null);

  const filtered = useMemo(() => {
    return MOCK_PASSES.filter((p) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'active') return p.status === 'ACTIVE' || p.status === 'IN_USE';
      return p.status === 'CONSUMED' || p.status === 'EXPIRED' || p.status === 'TRANSFERRED';
    });
  }, [activeFilter]);

  const activeCount = MOCK_PASSES.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'IN_USE'
  ).length;

  return {
    filtered,
    activeFilter,
    setActiveFilter,
    activeCount,
    qrPass,
    setQrPass,
  };
}
