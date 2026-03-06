'use client';

// マイパス管理ページ（View 層：usePassesPage の戻り値を表示のみ、SPEC V5）

import Link from 'next/link';
import { usePassesPage } from '../../hooks';
import type { Pass } from '../../hooks/usePassesPage';

// ===== ステータスラベル定義（View 表示用） =====
const STATUS_CONFIG: Record<
  Pass['status'],
  { label: string; className: string; dotColor: string }
> = {
  ACTIVE: {
    label: '有効',
    className: 'badge-green',
    dotColor: 'bg-emerald-400',
  },
  IN_USE: {
    label: '利用中',
    className: 'bg-blue-100 text-blue-700 badge',
    dotColor: 'bg-blue-400',
  },
  CONSUMED: {
    label: '使用済み',
    className: 'badge-gray',
    dotColor: 'bg-slate-300',
  },
  EXPIRED: {
    label: '期限切れ',
    className: 'badge-red',
    dotColor: 'bg-red-400',
  },
  TRANSFERRED: {
    label: '譲渡済み',
    className: 'badge-gray',
    dotColor: 'bg-slate-300',
  },
  PENDING: {
    label: '処理中',
    className: 'badge-yellow',
    dotColor: 'bg-amber-400',
  },
};

// ===== 残り時間フォーマット =====
function formatRemainingTime(minutes: number): string {
  if (minutes <= 0) return '0分';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分`;
  if (mins === 0) return `${hours}時間`;
  return `${hours}時間${mins}分`;
}

// ===== 有効期限フォーマット =====
function formatExpiry(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}日前に期限切れ`;
  if (diffDays === 0) return '本日期限';
  if (diffDays === 1) return '明日期限';
  return `${diffDays}日後に期限切れ`;
}

// ===== QRコード表示モーダル =====
function QrModal({ pass, onClose }: { pass: Pass; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900">チェックイン用 QR コード</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="14" y2="14" />
              <line x1="14" y1="4" x2="4" y2="14" />
            </svg>
          </button>
        </div>

        {/* QRコードプレースホルダー */}
        <div className="w-48 h-48 mx-auto mb-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
          <svg
            width="40"
            height="40"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* QRコードアイコン */}
            <rect x="3" y="3" width="8" height="8" />
            <rect x="13" y="3" width="8" height="8" />
            <rect x="3" y="13" width="8" height="8" />
            <rect x="15" y="15" width="2" height="2" />
            <rect x="18" y="15" width="2" height="2" />
            <rect x="15" y="18" width="2" height="2" />
            <rect x="18" y="18" width="2" height="2" />
          </svg>
          <span className="text-xs text-slate-400">QR 生成中...</span>
        </div>

        {/* パス情報 */}
        <p className="text-sm font-semibold text-slate-800 mb-1">{pass.planName}</p>
        <p className="text-xs text-slate-400 mb-4">{pass.venueName}</p>
        <p className="text-xs text-slate-400">
          残り {formatRemainingTime(pass.remainingMinutes)}
        </p>

        {/* 注意書き */}
        <p className="mt-5 text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
          スタッフまたはキオスクのスキャナーにこのQRコードを提示してください
        </p>
      </div>
    </div>
  );
}

// ===== パスカードコンポーネント =====
function PassCard({ pass, onShowQr }: { pass: Pass; onShowQr: (pass: Pass) => void }) {
  const statusCfg = STATUS_CONFIG[pass.status];
  const isActive = pass.status === 'ACTIVE' || pass.status === 'IN_USE';

  return (
    <div
      className={`card p-5 flex flex-col gap-4 ${
        !isActive ? 'opacity-60' : ''
      }`}
    >
      {/* ヘッダー：プラン名・ステータス */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusCfg.dotColor}`} />
            <h3 className="text-base font-bold text-slate-900 truncate">{pass.planName}</h3>
          </div>
          <p className="text-sm text-slate-500 truncate">{pass.venueName}</p>
        </div>
        <span className={statusCfg.className}>{statusCfg.label}</span>
      </div>

      {/* 残り時間プログレスバー */}
      {isActive && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>残り利用時間</span>
            <span className="font-semibold text-slate-700">
              {formatRemainingTime(pass.remainingMinutes)}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (pass.remainingMinutes / 360) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* デポジット情報 */}
      {pass.depositStatus !== 'NONE' && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">デポジット</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              {(pass.depositAmountMinor / 100).toLocaleString('ja-JP')} JPYC
            </span>
            <span
              className={
                pass.depositStatus === 'HELD'
                  ? 'badge-yellow'
                  : pass.depositStatus === 'RELEASED'
                  ? 'badge-green'
                  : 'badge-gray'
              }
            >
              {pass.depositStatus === 'HELD'
                ? '凍結中'
                : pass.depositStatus === 'RELEASED'
                ? '返金済み'
                : '一部捕捉'}
            </span>
          </div>
        </div>
      )}

      {/* 有効期限 */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>有効期限</span>
        <span
          className={
            new Date(pass.expiresAt) < new Date()
              ? 'text-red-500 font-medium'
              : 'text-slate-600'
          }
        >
          {formatExpiry(pass.expiresAt)}
        </span>
      </div>

      {/* アクションボタン */}
      {isActive && (
        <div className="flex gap-2 pt-1">
          {/* チェックインQRボタン */}
          <button
            onClick={() => onShowQr(pass)}
            className="btn-primary flex-1 py-2.5 text-sm"
          >
            QR でチェックイン
          </button>

          {/* 譲渡ボタン（譲渡可能な場合のみ） */}
          {pass.transferable && pass.status === 'ACTIVE' && (
            <Link
              href={`/passes/${pass.passId}/transfer`}
              className="btn-secondary py-2.5 px-3 text-sm"
            >
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12H19" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ===== フィルタータブ =====
const FILTER_TABS: { key: 'all' | 'active' | 'history'; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'active', label: '有効なパス' },
  { key: 'history', label: '利用履歴' },
];

// ===== ページコンポーネント =====
export default function PassesPage() {
  const { filtered, activeFilter, setActiveFilter, activeCount, qrPass, setQrPass } = usePassesPage();

  return (
    <>
      {/* ページヘッダー */}
      <div className="bg-surface-900 pt-24 pb-10">
        <div className="container-main">
          {/* パンくずリスト */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-slate-300 transition-colors">ホーム</Link>
            <span>/</span>
            <span className="text-slate-300">マイパス</span>
          </nav>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-2">マイパス</h1>
              <p className="text-slate-400">
                保有中：
                <span className="text-white font-semibold ml-1">{activeCount}件</span>
                の有効パス
              </p>
            </div>
            {/* 店舗を探すボタン */}
            <Link href="/venues" className="btn-jpyc py-2.5 text-sm">
              新しいパスを購入
            </Link>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container-main py-8">
        {/* フィルタータブ */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-8 w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeFilter === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.key === 'active' && activeCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-brand-100 text-brand-700 text-xs font-bold rounded-full">
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* パスグリッド */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎟</div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              {activeFilter === 'active' ? '有効なパスがありません' : 'パスがありません'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              お近くの店舗を探してパスを購入しましょう
            </p>
            <Link href="/venues" className="btn-primary">
              店舗を探す
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((pass) => (
              <PassCard key={pass.passId} pass={pass} onShowQr={setQrPass} />
            ))}
          </div>
        )}

        {/* 残高表示セクション */}
        <div className="mt-12 card p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-700 mb-1">JPYC 残高</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">—</span>
                <span className="text-sm text-slate-400">JPYC</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">ウォレット接続後に表示されます</p>
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary py-2 px-4 text-sm">
                チャージ
              </button>
              <button className="btn-primary py-2 px-4 text-sm">
                ウォレット接続
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QRコードモーダル */}
      {qrPass && (
        <QrModal pass={qrPass} onClose={() => setQrPass(null)} />
      )}
    </>
  );
}
