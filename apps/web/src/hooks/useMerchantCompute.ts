/**
 * useMerchantCompute: 店舗向け算力ノード管理 Controller（SPEC §8, R8）。
 * ノード一覧・編集モーダル・保存処理を保持；View は薄く表示のみ。
 */

import { useState } from 'react';
import type { ManagedNode } from '../models/merchant.model';

// 型は merchant.model から；モックはここで定義（将来 Service で取得）
const MOCK_VENUE_NAME = '快適ネットカフェ 秋葉原店';

const MOCK_NODES: ManagedNode[] = [
  {
    nodeId: 'node-001',
    seatId: 'seat-b07',
    seatLabel: 'ブース B-07',
    specs: { cpuModel: 'Core i9-13900K', cpuCores: 24, gpuModel: 'RTX 4090', vram: 24, ram: 64 },
    status: 'COMPUTING',
    enabled: true,
    pricePerHourMinor: 120000,
    minBookingHours: 1,
    maxBookingHours: 8,
    supportedTasks: ['ML_TRAINING', 'RENDERING', 'ZK_PROVING', 'GENERAL'],
    availableWindows: [
      { dayOfWeek: 1, startTime: '10:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '10:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '17:00' },
    ],
    earnings: { thisMonthMinor: 98400000, totalMinor: 382000000, completedJobs: 47, uptimePercent: 82.3 },
  },
  {
    nodeId: 'node-002',
    seatId: 'seat-v02',
    seatLabel: 'VIP V-02',
    specs: { cpuModel: 'Ryzen 9 7950X', cpuCores: 32, gpuModel: 'RTX 4080', vram: 16, ram: 128 },
    status: 'IDLE',
    enabled: true,
    pricePerHourMinor: 100000,
    minBookingHours: 2,
    maxBookingHours: 12,
    supportedTasks: ['ML_TRAINING', 'RENDERING', 'GENERAL'],
    availableWindows: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '16:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '16:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '16:00' },
      { dayOfWeek: 6, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 0, startTime: '09:00', endTime: '18:00' },
    ],
    earnings: { thisMonthMinor: 72000000, totalMinor: 210000000, completedJobs: 31, uptimePercent: 68.1 },
  },
  {
    nodeId: 'node-003',
    seatId: 'seat-o15',
    seatLabel: 'オープン O-15',
    specs: { cpuModel: 'Core i7-12700K', cpuCores: 12, gpuModel: 'RTX 3080', vram: 10, ram: 32 },
    status: 'OFFLINE',
    enabled: false,
    pricePerHourMinor: 60000,
    minBookingHours: 1,
    maxBookingHours: 6,
    supportedTasks: ['RENDERING', 'GENERAL'],
    availableWindows: [],
    earnings: { thisMonthMinor: 0, totalMinor: 48000000, completedJobs: 12, uptimePercent: 0 },
  },
];

export interface UseMerchantComputeReturn {
  venueName: string;
  nodes: ManagedNode[];
  editingNode: ManagedNode | null | undefined;
  setEditingNode: (n: ManagedNode | null | undefined) => void;
  saving: boolean;
  saveSuccess: boolean;
  handleToggle: (nodeId: string) => void;
  handleSave: (data: Partial<ManagedNode>) => Promise<void>;
}

export function useMerchantCompute(): UseMerchantComputeReturn {
  const [nodes, setNodes] = useState<ManagedNode[]>(MOCK_NODES);
  const [editingNode, setEditingNode] = useState<ManagedNode | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggle = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.nodeId === nodeId
          ? { ...n, enabled: !n.enabled, status: !n.enabled ? 'IDLE' : 'OFFLINE' }
          : n
      )
    );
  };

  const handleSave = async (data: Partial<ManagedNode>) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    if (editingNode) {
      setNodes((prev) =>
        prev.map((n) => (n.nodeId === editingNode.nodeId ? { ...n, ...data } : n))
      );
    } else {
      const newNode: ManagedNode = {
        nodeId: `node-${Date.now()}`,
        seatId: `seat-new-${Date.now()}`,
        seatLabel: 'オープン O-XX',
        specs: { cpuModel: '—', cpuCores: 0, gpuModel: '—', vram: 0, ram: 0 },
        status: 'OFFLINE',
        enabled: false,
        pricePerHourMinor: (data.pricePerHourMinor ?? 0),
        minBookingHours: data.minBookingHours ?? 1,
        maxBookingHours: data.maxBookingHours ?? 8,
        supportedTasks: data.supportedTasks ?? ['GENERAL'],
        availableWindows: data.availableWindows ?? [],
        earnings: { thisMonthMinor: 0, totalMinor: 0, completedJobs: 0, uptimePercent: 0 },
        ...data,
      } as ManagedNode;
      setNodes((prev) => [...prev, newNode]);
    }
    setSaving(false);
    setEditingNode(undefined);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return {
    venueName: MOCK_VENUE_NAME,
    nodes,
    editingNode,
    setEditingNode,
    saving,
    saveSuccess,
    handleToggle,
    handleSave,
  };
}
