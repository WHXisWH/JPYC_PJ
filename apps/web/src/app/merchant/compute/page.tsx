'use client';

// 加盟店向け算力ノード管理ページ
// 遊休PCの登録・稼働時間設定・収益確認・ノードの有効化/無効化を行う

import { useState } from 'react';
import Link from 'next/link';

// ===== 型定義 =====

// ノードステータス
type NodeStatus = 'IDLE' | 'COMPUTING' | 'OFFLINE' | 'RESERVED';

// 曜日
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// 対応タスク種別
type TaskType = 'ML_TRAINING' | 'RENDERING' | 'ZK_PROVING' | 'GENERAL';

// 稼働可能時間帯
interface AvailableWindow {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

// 算力ノードの型
interface ManagedNode {
  nodeId: string;
  seatId: string;
  seatLabel: string;           // 例: "ブース B-07"
  specs: {
    cpuModel: string;
    cpuCores: number;
    gpuModel: string;
    vram: number;
    ram: number;
  };
  status: NodeStatus;
  enabled: boolean;
  pricePerHourMinor: number;
  minBookingHours: number;
  maxBookingHours: number;
  supportedTasks: TaskType[];
  availableWindows: AvailableWindow[];
  // 収益サマリー
  earnings: {
    thisMonthMinor: number;
    totalMinor: number;
    completedJobs: number;
    uptimePercent: number;
  };
}

// ===== 定数 =====

// 曜日ラベル定義
const DAY_LABELS: Record<DayOfWeek, string> = {
  0: '日', 1: '月', 2: '火', 3: '水', 4: '木', 5: '金', 6: '土',
};

// タスク種別設定
const TASK_CONFIG: Record<TaskType, { label: string; icon: string }> = {
  ML_TRAINING: { label: 'AI / ML 学習', icon: '🤖' },
  RENDERING:   { label: '3DCG レンダリング', icon: '🎨' },
  ZK_PROVING:  { label: 'ZK 証明生成', icon: '🔐' },
  GENERAL:     { label: '汎用計算', icon: '⚙️' },
};

// ノードステータス設定
const NODE_STATUS_CONFIG: Record<NodeStatus, { label: string; dot: string; badge: string }> = {
  IDLE:      { label: '待機中', dot: 'bg-emerald-400', badge: 'badge-green' },
  COMPUTING: { label: '計算中', dot: 'bg-blue-400 animate-pulse', badge: 'badge-blue' },
  RESERVED:  { label: '予約済み', dot: 'bg-amber-400', badge: 'badge-yellow' },
  OFFLINE:   { label: 'オフライン', dot: 'bg-slate-300', badge: 'badge-gray' },
};

// ===== モックデータ =====

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
    earnings: {
      thisMonthMinor: 98400000,   // 984,000 JPYC
      totalMinor: 382000000,
      completedJobs: 47,
      uptimePercent: 82.3,
    },
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
    earnings: {
      thisMonthMinor: 72000000,
      totalMinor: 210000000,
      completedJobs: 31,
      uptimePercent: 68.1,
    },
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
    earnings: {
      thisMonthMinor: 0,
      totalMinor: 48000000,
      completedJobs: 12,
      uptimePercent: 0,
    },
  },
];

// ===== JPYCフォーマット =====
function formatJPYC(minor: number): string {
  return (minor / 100).toLocaleString('ja-JP');
}

// ===== ヘッダー収益サマリー =====
function TopSummary({ nodes }: { nodes: ManagedNode[] }) {
  // 有効ノード数・今月合計収益を集計
  const enabledCount = nodes.filter((n) => n.enabled).length;
  const computingCount = nodes.filter((n) => n.status === 'COMPUTING').length;
  const thisMonthTotal = nodes.reduce((sum, n) => sum + n.earnings.thisMonthMinor, 0);
  const totalEarnings = nodes.reduce((sum, n) => sum + n.earnings.totalMinor, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[
        { label: '登録ノード数', value: `${nodes.length}台`, sub: `有効 ${enabledCount}台`, icon: '🖥️' },
        { label: '現在計算中', value: `${computingCount}台`, sub: '収益獲得中', icon: '⚡' },
        { label: '今月の算力収益', value: `${formatJPYC(thisMonthTotal)} JPYC`, sub: '精算待ち', icon: '💴' },
        { label: '累計収益', value: `${formatJPYC(totalEarnings)} JPYC`, sub: '全期間合計', icon: '📊' },
      ].map((s) => (
        <div key={s.label} className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{s.icon}</span>
            <span className="text-xs text-slate-400">{s.label}</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{s.value}</div>
          <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ===== 稼働時間設定ビジュアル =====
function AvailabilityDisplay({ windows }: { windows: AvailableWindow[] }) {
  // 全曜日でウィンドウを整理
  const byDay: Record<DayOfWeek, AvailableWindow[]> = {
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
  };
  windows.forEach((w) => byDay[w.dayOfWeek].push(w));

  return (
    <div className="flex gap-1.5">
      {([1, 2, 3, 4, 5, 6, 0] as DayOfWeek[]).map((day) => {
        const hasWindow = byDay[day].length > 0;
        return (
          <div key={day} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                hasWindow
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-slate-50 text-slate-300'
              }`}
            >
              {DAY_LABELS[day]}
            </div>
            {hasWindow && (
              <div className="text-[10px] text-slate-400 text-center leading-tight">
                {byDay[day][0].startTime.slice(0, 5)}<br />〜<br />{byDay[day][0].endTime.slice(0, 5)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ===== ノード詳細カード =====
function NodeCard({
  node,
  onToggle,
  onEdit,
}: {
  node: ManagedNode;
  onToggle: (nodeId: string) => void;
  onEdit: (node: ManagedNode) => void;
}) {
  const statusCfg = NODE_STATUS_CONFIG[node.status];

  return (
    <div className={`card overflow-hidden transition-opacity ${!node.enabled ? 'opacity-60' : ''}`}>
      {/* カードヘッダー */}
      <div
        className="px-5 py-4 flex items-center justify-between gap-3"
        style={{
          background: node.enabled
            ? 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)'
            : '#F8FAFC',
        }}
      >
        <div className="flex items-center gap-3">
          {/* ステータスドット */}
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
          <div>
            <div className={`font-bold text-sm ${node.enabled ? 'text-white' : 'text-slate-600'}`}>
              {node.seatLabel}
            </div>
            <div className={`text-xs ${node.enabled ? 'text-slate-300' : 'text-slate-400'}`}>
              {node.specs.gpuModel} · {node.specs.vram}GB VRAM
            </div>
          </div>
        </div>

        {/* 有効/無効トグル */}
        <label className="flex items-center gap-2 cursor-pointer">
          <span className={`text-xs font-medium ${node.enabled ? 'text-white' : 'text-slate-500'}`}>
            {node.enabled ? '有効' : '無効'}
          </span>
          <div
            onClick={() => onToggle(node.nodeId)}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
              node.enabled ? 'bg-brand-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                node.enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
        </label>
      </div>

      {/* カードボディ */}
      <div className="p-5 flex flex-col gap-4">
        {/* スペック詳細 */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <div className="text-slate-400 mb-0.5">CPU</div>
            <div className="font-semibold text-slate-700 truncate">{node.specs.cpuCores}コア</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <div className="text-slate-400 mb-0.5">RAM</div>
            <div className="font-semibold text-slate-700">{node.specs.ram}GB</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <div className="text-slate-400 mb-0.5">現在</div>
            <span className={`${statusCfg.badge} text-xs`}>{statusCfg.label}</span>
          </div>
        </div>

        {/* 収益ミニサマリー */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-jpyc-50 rounded-xl p-3">
            <div className="text-xs text-jpyc-600 mb-0.5">今月の収益</div>
            <div className="text-base font-extrabold text-jpyc-700">
              {formatJPYC(node.earnings.thisMonthMinor)}
              <span className="text-xs font-medium ml-0.5">JPYC</span>
            </div>
          </div>
          <div className="bg-brand-50 rounded-xl p-3">
            <div className="text-xs text-brand-600 mb-0.5">稼働率</div>
            <div className="text-base font-extrabold text-brand-700">
              {node.earnings.uptimePercent.toFixed(1)}
              <span className="text-xs font-medium ml-0.5">%</span>
            </div>
          </div>
        </div>

        {/* 稼働可能曜日 */}
        <div>
          <div className="text-xs text-slate-400 mb-2">稼働可能時間帯</div>
          {node.availableWindows.length === 0 ? (
            <span className="text-xs text-slate-400 italic">未設定</span>
          ) : (
            <AvailabilityDisplay windows={node.availableWindows} />
          )}
        </div>

        {/* 価格・対応タスク */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-extrabold text-slate-900">
              {formatJPYC(node.pricePerHourMinor)}
            </span>
            <span className="text-xs text-jpyc-500 font-semibold ml-1">JPYC/時間</span>
          </div>
          <div className="flex gap-1">
            {node.supportedTasks.slice(0, 3).map((t) => (
              <span key={t} title={TASK_CONFIG[t].label} className="text-base">
                {TASK_CONFIG[t].icon}
              </span>
            ))}
            {node.supportedTasks.length > 3 && (
              <span className="text-xs text-slate-400 self-end">+{node.supportedTasks.length - 3}</span>
            )}
          </div>
        </div>

        {/* 設定ボタン */}
        <button
          onClick={() => onEdit(node)}
          className="btn-secondary w-full py-2 text-sm"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
          </svg>
          設定を編集
        </button>
      </div>
    </div>
  );
}

// ===== ノード編集・新規登録モーダル =====
function NodeEditModal({
  node,
  onClose,
  onSave,
  saving,
}: {
  node: ManagedNode | null; // null = 新規登録
  onClose: () => void;
  onSave: (data: Partial<ManagedNode>) => void;
  saving: boolean;
}) {
  // フォーム状態
  const [pricePerHour, setPricePerHour] = useState(
    node ? node.pricePerHourMinor / 100 : 800
  );
  const [minHours, setMinHours] = useState(node?.minBookingHours ?? 1);
  const [maxHours, setMaxHours] = useState(node?.maxBookingHours ?? 8);
  const [selectedTasks, setSelectedTasks] = useState<TaskType[]>(
    node?.supportedTasks ?? ['GENERAL']
  );
  // 稼働曜日（trueの曜日が有効）
  const [activeDays, setActiveDays] = useState<Record<DayOfWeek, boolean>>(() => {
    const base: Record<DayOfWeek, boolean> = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
    node?.availableWindows.forEach((w) => { base[w.dayOfWeek] = true; });
    return base;
  });
  // 稼働時間帯（全曜日共通）
  const [startTime, setStartTime] = useState(() => {
    return node?.availableWindows[0]?.startTime ?? '10:00';
  });
  const [endTime, setEndTime] = useState(() => {
    return node?.availableWindows[0]?.endTime ?? '17:00';
  });

  // タスク種別の切り替え
  const toggleTask = (t: TaskType) => {
    setSelectedTasks((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  // 保存処理
  const handleSave = () => {
    const windows: AvailableWindow[] = (Object.entries(activeDays) as [string, boolean][])
      .filter(([, active]) => active)
      .map(([day]) => ({
        dayOfWeek: Number(day) as DayOfWeek,
        startTime,
        endTime,
      }));

    onSave({
      pricePerHourMinor: pricePerHour * 100,
      minBookingHours: minHours,
      maxBookingHours: maxHours,
      supportedTasks: selectedTasks,
      availableWindows: windows,
    });
  };

  const isNew = node === null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {isNew ? '新規ノードを登録する' : `${node?.seatLabel} の設定を編集`}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="14" y2="14" /><line x1="14" y1="4" x2="4" y2="14" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
          {/* 新規登録時：ノード前提説明 */}
          {isNew && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-700">
              <p className="font-semibold mb-1">📋 登録前の確認事項</p>
              <ul className="flex flex-col gap-1 text-brand-600">
                <li>• 最低スペック：GTX 1660以上 / 16GB RAM</li>
                <li>• プラットフォームAgentソフトのインストールが必要</li>
                <li>• ユーザー着席時はタスクを自動中断します</li>
              </ul>
            </div>
          )}

          {/* 時間単価設定 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              時間単価（JPYC / 時間）
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={100}
                max={5000}
                step={50}
                value={pricePerHour}
                onChange={(e) => setPricePerHour(Number(e.target.value))}
                className="input-field w-32"
              />
              <span className="text-sm text-slate-500">JPYC / 時間</span>
              <span className="ml-auto text-xs text-slate-400">
                推奨：600〜1,500 JPYC
              </span>
            </div>
          </div>

          {/* 予約時間レンジ */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              予約可能時間レンジ
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">最短</span>
                <select
                  value={minHours}
                  onChange={(e) => setMinHours(Number(e.target.value))}
                  className="select-field w-20"
                >
                  {[1, 2, 3, 4].map((h) => <option key={h} value={h}>{h}時間</option>)}
                </select>
              </div>
              <span className="text-slate-300">〜</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">最長</span>
                <select
                  value={maxHours}
                  onChange={(e) => setMaxHours(Number(e.target.value))}
                  className="select-field w-20"
                >
                  {[4, 6, 8, 12, 24].map((h) => <option key={h} value={h}>{h}時間</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 対応タスク種別 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              対応タスク種別（複数選択可）
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(TASK_CONFIG) as [TaskType, typeof TASK_CONFIG[TaskType]][]).map(
                ([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleTask(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                      selectedTasks.includes(key)
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">{cfg.icon}</span>
                    <span>{cfg.label}</span>
                    {selectedTasks.includes(key) && (
                      <svg className="ml-auto" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="3 7 6 11 13 4" />
                      </svg>
                    )}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 稼働曜日設定 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              稼働可能曜日
            </label>
            <p className="text-xs text-slate-400 mb-3">
              客足のピーク時間帯を避けて設定することをお勧めします
            </p>
            <div className="flex gap-2 mb-4">
              {([1, 2, 3, 4, 5, 6, 0] as DayOfWeek[]).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDays((prev) => ({ ...prev, [day]: !prev[day] }))}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                    activeDays[day]
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>

            {/* 稼働時間帯（有効曜日に共通適用） */}
            {Object.values(activeDays).some(Boolean) && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-500 flex-shrink-0">時間帯（全有効曜日に適用）</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-field w-32 py-2"
                />
                <span className="text-slate-400">〜</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-field w-32 py-2"
                />
              </div>
            )}
          </div>

          {/* 収益シミュレーション */}
          {pricePerHour > 0 && Object.values(activeDays).some(Boolean) && (
            <div className="bg-jpyc-50 border border-jpyc-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-jpyc-700 mb-2">💴 月間収益シミュレーション</p>
              {(() => {
                const activeDayCount = Object.values(activeDays).filter(Boolean).length;
                const [sh, sm] = startTime.split(':').map(Number);
                const [eh, em] = endTime.split(':').map(Number);
                const hoursPerDay = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
                // 月4週として計算、稼働率70%を想定
                const estimatedHours = activeDayCount * 4 * hoursPerDay * 0.7;
                const grossMinor = Math.floor(estimatedHours * pricePerHour * 100);
                const netMinor = Math.floor(grossMinor * 0.75); // 店舗取り分75%

                return (
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between text-jpyc-600">
                      <span>推定稼働時間（月）</span>
                      <span className="font-semibold">{estimatedHours.toFixed(1)} h（稼働率70%想定）</span>
                    </div>
                    <div className="flex justify-between text-jpyc-600">
                      <span>総収益</span>
                      <span className="font-semibold">{formatJPYC(grossMinor)} JPYC</span>
                    </div>
                    <div className="flex justify-between font-bold text-jpyc-800 border-t border-jpyc-200 pt-1 mt-1">
                      <span>店舗取り分（75%）</span>
                      <span>{formatJPYC(netMinor)} JPYC / 月</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* モーダルフッター */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedTasks.length === 0}
            className="btn-primary flex-1"
          >
            {saving ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </span>
            ) : (
              isNew ? 'ノードを登録する' : '設定を保存する'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== ガイドセクション =====
function SetupGuide() {
  const steps = [
    {
      step: '01',
      title: 'Agent ソフトのインストール',
      desc: 'プラットフォーム提供のAgentソフトウェアを各PCにインストールします。タスクスケジューリング・監視・結果報告を自動化します。',
      icon: '💿',
    },
    {
      step: '02',
      title: 'ノードを登録',
      desc: '座席と紐づけてノードを登録。GPUスペックに基づき適正価格が自動提案されます。',
      icon: '📝',
    },
    {
      step: '03',
      title: '稼働時間帯を設定',
      desc: '客足のピーク時間を避けて稼働ウィンドウを設定。ユーザーが着席すると自動的にタスクが中断されます。',
      icon: '🕐',
    },
    {
      step: '04',
      title: 'JPYC で自動収益化',
      desc: 'タスク完了後、収益の75%が自動的にJPYCで店舗口座へ入金されます。',
      icon: '💴',
    },
  ];

  return (
    <div className="card p-6">
      <h2 className="text-base font-bold text-slate-800 mb-5">📖 ノード提供を始めるには</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <div key={s.step} className="relative">
            {/* コネクター矢印 */}
            {i < steps.length - 1 && (
              <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-brand-200 to-transparent z-10 -translate-x-4" />
            )}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{s.icon}</span>
                <span className="text-xs font-extrabold text-brand-400 tracking-widest">STEP {s.step}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">{s.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== ページコンポーネント =====
export default function MerchantComputePage() {
  // ノード一覧の状態（モックデータで初期化）
  const [nodes, setNodes] = useState<ManagedNode[]>(MOCK_NODES);
  // 編集対象ノード（nullで新規登録モーダル）
  const [editingNode, setEditingNode] = useState<ManagedNode | null | undefined>(undefined);
  // 保存処理中フラグ
  const [saving, setSaving] = useState(false);
  // 保存成功フラグ
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ノードの有効/無効を切り替え
  const handleToggle = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.nodeId === nodeId
          ? { ...n, enabled: !n.enabled, status: !n.enabled ? 'IDLE' : 'OFFLINE' }
          : n
      )
    );
  };

  // 設定保存処理
  const handleSave = async (data: Partial<ManagedNode>) => {
    setSaving(true);
    // 実際のAPI呼び出しはここに実装する（モック: 1秒待機）
    await new Promise((r) => setTimeout(r, 800));

    if (editingNode) {
      // 既存ノードを更新
      setNodes((prev) =>
        prev.map((n) => (n.nodeId === editingNode.nodeId ? { ...n, ...data } : n))
      );
    } else {
      // 新規ノードを追加（モック）
      const newNode: ManagedNode = {
        nodeId: `node-${Date.now()}`,
        seatId: `seat-new-${Date.now()}`,
        seatLabel: 'オープン O-XX',
        specs: { cpuModel: '—', cpuCores: 0, gpuModel: '—', vram: 0, ram: 0 },
        status: 'OFFLINE',
        enabled: false,
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

  return (
    <>
      {/* ===== ページヘッダー ===== */}
      <div
        className="pt-24 pb-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #0F172A 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background:
              'radial-gradient(ellipse 50% 60% at 70% 50%, rgba(245,158,11,0.3) 0%, transparent 70%)',
          }}
        />
        <div className="container-main relative z-10">
          {/* パンくずリスト */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-slate-300 transition-colors">ホーム</Link>
            <span>/</span>
            <Link href="/compute" className="hover:text-slate-300 transition-colors">算力マーケット</Link>
            <span>/</span>
            <span className="text-slate-300">ノード提供（店舗向け）</span>
          </nav>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-jpyc-500/10 border border-jpyc-500/20 rounded-full text-jpyc-300 text-sm font-semibold mb-4">
                🏪 {MOCK_VENUE_NAME}
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-2">算力ノード管理</h1>
              <p className="text-slate-400">
                遊休PCを算力ノードとして登録・管理し、JPYCで収益を得ます
              </p>
            </div>
            {/* 新規ノード登録ボタン */}
            <button
              onClick={() => setEditingNode(null)}
              className="btn-jpyc"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新規ノードを登録
            </button>
          </div>
        </div>
      </div>

      {/* ===== メインコンテンツ ===== */}
      <div className="container-main py-8">
        {/* 保存成功バナー */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="2 6 5 10 11 3" />
              </svg>
            </div>
            <p className="font-semibold text-emerald-800">設定を保存しました</p>
          </div>
        )}

        {/* 収益サマリー */}
        <TopSummary nodes={nodes} />

        {/* ノードグリッド */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">
              登録済みノード
              <span className="ml-2 text-sm font-normal text-slate-400">（{nodes.length}台）</span>
            </h2>
          </div>

          {nodes.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="text-5xl mb-4">🖥️</div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">
                まだノードが登録されていません
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                遊休PCを算力ノードとして登録し、JPYCで収益を得ましょう
              </p>
              <button onClick={() => setEditingNode(null)} className="btn-primary">
                最初のノードを登録する
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {nodes.map((node) => (
                <NodeCard
                  key={node.nodeId}
                  node={node}
                  onToggle={handleToggle}
                  onEdit={setEditingNode}
                />
              ))}
            </div>
          )}
        </div>

        {/* セットアップガイド */}
        <SetupGuide />
      </div>

      {/* ===== 編集/新規登録モーダル ===== */}
      {editingNode !== undefined && (
        <NodeEditModal
          node={editingNode}
          onClose={() => setEditingNode(undefined)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </>
  );
}
