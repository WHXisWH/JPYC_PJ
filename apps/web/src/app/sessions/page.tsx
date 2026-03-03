'use client';

// セッションページ（チェックイン / チェックアウト）
// アクティブセッションの表示、チェックアウト処理、利用時間・料金の確認を行う

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createNodeStayClient } from '../../services/nodestay';

// セッションステータスの型
type SessionStatus = 'IN_USE' | 'OVERTIME' | 'ENDED';

// セッションデータの型（モック）
interface ActiveSession {
  sessionId: string;
  passId: string;
  planName: string;
  venueName: string;
  seatId: string;
  seatType: 'OPEN' | 'BOOTH' | 'FLAT' | 'VIP';
  checkInAt: string; // ISO 8601
  baseDurationMinutes: number;
  basePriceMinor: number;
  status: SessionStatus;
}

// 座席タイプの日本語マッピング
const SEAT_TYPE_LABELS: Record<ActiveSession['seatType'], string> = {
  OPEN: 'オープン席',
  BOOTH: 'ブース席',
  FLAT: 'フラット席',
  VIP: 'VIP席',
};

// ===== 経過時間フォーマット =====
function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h > 0 ? `${h}時間` : '',
    `${String(m).padStart(2, '0')}分`,
    `${String(s).padStart(2, '0')}秒`,
  ]
    .filter(Boolean)
    .join(' ');
}

// ===== JPYC フォーマット =====
function formatJPYC(minor: number): string {
  return (minor / 100).toLocaleString('ja-JP');
}

// ===== 超過料金計算（PRDのルールに準拠） =====
function calcOvertimeCharge(overtimeMinutes: number): number {
  if (overtimeMinutes <= 0) return 0;
  if (overtimeMinutes <= 10) return 0; // バッファ
  if (overtimeMinutes <= 30) return Math.ceil((overtimeMinutes - 10) / 10) * 10000; // 100 JPYC/10分
  if (overtimeMinutes <= 60) return 20000 + Math.ceil((overtimeMinutes - 30) / 10) * 15000; // 150 JPYC/10分
  return -1; // 次パックへ自動アップグレード
}

// ===== アクティブセッション表示コンポーネント =====
function ActiveSessionCard({
  session,
  elapsed,
  onCheckout,
  checking,
}: {
  session: ActiveSession;
  elapsed: number; // 経過秒数
  onCheckout: () => void;
  checking: boolean;
}) {
  // 経過分数
  const elapsedMinutes = Math.floor(elapsed / 60);
  // 超過分数
  const overtimeMinutes = Math.max(0, elapsedMinutes - session.baseDurationMinutes);
  // 超過料金
  const overtimeCharge = calcOvertimeCharge(overtimeMinutes);
  // 進行率（%）
  const progress = Math.min(100, (elapsedMinutes / session.baseDurationMinutes) * 100);
  // 残り時間（秒）
  const remainingSecs = Math.max(0, session.baseDurationMinutes * 60 - elapsed);

  return (
    <div className="card overflow-hidden max-w-2xl mx-auto">
      {/* カードヘッダー（ダーク背景） */}
      <div
        className="px-6 py-5 text-white"
        style={{
          background: 'linear-gradient(135deg, #312E81 0%, #4338CA 100%)',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold">利用中</span>
          </div>
          <span className="text-white/60 text-xs">{session.sessionId}</span>
        </div>
        <h2 className="text-xl font-bold">{session.venueName}</h2>
        <p className="text-white/70 text-sm mt-0.5">
          {SEAT_TYPE_LABELS[session.seatType]} · 座席 {session.seatId}
        </p>
      </div>

      {/* メインボディ */}
      <div className="px-6 py-6 flex flex-col gap-6">
        {/* 経過時間タイマー */}
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1 font-medium tracking-wide uppercase">
            経過時間
          </p>
          <div
            className="text-5xl font-extrabold tracking-tight tabular-nums"
            style={{
              color: overtimeMinutes > 0 ? '#DC2626' : '#1E293B',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatElapsed(elapsed)}
          </div>
        </div>

        {/* 進行バー */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>チェックイン：{new Date(session.checkInAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>
              {overtimeMinutes > 0 ? (
                <span className="text-red-500 font-semibold">+{overtimeMinutes}分超過</span>
              ) : (
                <span>残り {Math.floor(remainingSecs / 60)}分{remainingSecs % 60}秒</span>
              )}
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                overtimeMinutes > 0
                  ? 'bg-gradient-to-r from-red-400 to-red-600'
                  : 'bg-gradient-to-r from-brand-400 to-brand-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>開始</span>
            <span className="font-medium text-slate-600">
              基本時間：{session.baseDurationMinutes}分
            </span>
            <span>上限</span>
          </div>
        </div>

        {/* 料金サマリー */}
        <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
          <div className="px-4 py-3 flex justify-between text-sm">
            <span className="text-slate-500">基本料金</span>
            <span className="font-semibold text-slate-800">
              {formatJPYC(session.basePriceMinor)} JPYC
            </span>
          </div>
          <div className="px-4 py-3 flex justify-between text-sm">
            <span className="text-slate-500">超過料金</span>
            <span className={`font-semibold ${overtimeCharge > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              {overtimeCharge === -1
                ? '次パックへ自動切替'
                : overtimeCharge === 0
                ? '0 JPYC'
                : `+${formatJPYC(overtimeCharge)} JPYC`}
            </span>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <span className="font-bold text-slate-800">現在の推定合計</span>
            <span className="font-extrabold text-brand-700">
              {overtimeCharge === -1
                ? '自動精算中'
                : `${formatJPYC(session.basePriceMinor + Math.max(0, overtimeCharge))} JPYC`}
            </span>
          </div>
        </div>

        {/* チェックアウトボタン */}
        <button
          onClick={onCheckout}
          disabled={checking}
          className="btn-primary w-full py-3.5 text-base"
        >
          {checking ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              精算中...
            </span>
          ) : (
            'チェックアウトして精算する'
          )}
        </button>

        {/* 注意文 */}
        <p className="text-xs text-slate-400 text-center -mt-2">
          チェックアウト時に実時間で精算されます。デポジット差額は自動返金されます。
        </p>
      </div>
    </div>
  );
}

// ===== 精算完了コンポーネント =====
function CheckoutComplete({
  result,
  onClose,
}: {
  result: { usedMinutes: number; chargesMinor: number };
  onClose: () => void;
}) {
  return (
    <div className="max-w-md mx-auto text-center">
      {/* 成功アイコン */}
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          width="36"
          height="36"
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 12 9 17 20 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
        チェックアウト完了
      </h2>
      <p className="text-slate-500 mb-8">ご利用ありがとうございました</p>

      {/* 精算サマリー */}
      <div className="card p-5 text-left mb-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">精算明細</h3>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">利用時間</span>
            <span className="font-semibold text-slate-800">
              {Math.floor(result.usedMinutes / 60)}時間{result.usedMinutes % 60}分
            </span>
          </div>
          <div className="border-t border-slate-50 pt-3 flex justify-between">
            <span className="font-bold text-slate-800">請求合計</span>
            <span className="text-xl font-extrabold text-brand-700">
              {formatJPYC(result.chargesMinor)} JPYC
            </span>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-3">
        <Link href="/passes" className="btn-secondary flex-1">
          マイパスへ
        </Link>
        <Link href="/venues" className="btn-primary flex-1">
          次の店舗を探す
        </Link>
      </div>
    </div>
  );
}

// ===== ページコンポーネント =====
export default function SessionsPage() {
  // アクティブセッション（モック）
  const [session] = useState<ActiveSession | null>({
    sessionId: 'sess-001',
    passId: 'pass-001',
    planName: '3時間パック',
    venueName: '快適ネットカフェ 渋谷店',
    seatId: 'B-07',
    seatType: 'BOOTH',
    checkInAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45分前にチェックイン
    baseDurationMinutes: 180,
    basePriceMinor: 50000,
    status: 'IN_USE',
  });

  // 経過秒数（1秒ごとに更新）
  const [elapsed, setElapsed] = useState(0);
  // チェックアウト処理中
  const [checking, setChecking] = useState(false);
  // 精算結果
  const [checkoutResult, setCheckoutResult] = useState<{
    usedMinutes: number;
    chargesMinor: number;
  } | null>(null);

  // チェックイン時刻からの経過秒数を計算
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!session) return;

    // 初期経過秒数を計算
    const calcElapsed = () => {
      return Math.floor((Date.now() - new Date(session.checkInAt).getTime()) / 1000);
    };

    setElapsed(calcElapsed());

    // 1秒ごとに更新
    intervalRef.current = setInterval(() => {
      setElapsed(calcElapsed());
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session]);

  // チェックアウト処理
  const handleCheckout = async () => {
    if (!session) return;
    setChecking(true);

    const client = createNodeStayClient();
    const idempotencyKey = `checkout-${session.sessionId}-${Date.now()}`;

    try {
      const result = await client.checkoutSession(
        { sessionId: session.sessionId },
        idempotencyKey
      );

      // APIのレスポンスから精算結果を取得（モックフォールバック）
      const usedMinutes = (result as { usedMinutes?: number }).usedMinutes ?? Math.floor(elapsed / 60);
      const chargesMinor = (result as { chargesMinor?: number }).chargesMinor ?? session.basePriceMinor;

      // タイマーを停止
      if (intervalRef.current) clearInterval(intervalRef.current);

      setCheckoutResult({ usedMinutes, chargesMinor });
    } catch {
      // チェックアウトエラー
      alert('チェックアウトに失敗しました。スタッフにお声がけください。');
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      {/* ページヘッダー */}
      <div className="bg-surface-900 pt-24 pb-10">
        <div className="container-main">
          {/* パンくずリスト */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-slate-300 transition-colors">ホーム</Link>
            <span>/</span>
            <span className="text-slate-300">セッション</span>
          </nav>
          <h1 className="text-3xl font-extrabold text-white mb-2">セッション</h1>
          <p className="text-slate-400">現在のご利用状況を確認できます</p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container-main py-10">
        {checkoutResult ? (
          // 精算完了画面
          <CheckoutComplete
            result={checkoutResult}
            onClose={() => setCheckoutResult(null)}
          />
        ) : session ? (
          // アクティブセッション表示
          <ActiveSessionCard
            session={session}
            elapsed={elapsed}
            onCheckout={handleCheckout}
            checking={checking}
          />
        ) : (
          // セッションなし
          <div className="max-w-md mx-auto text-center py-20">
            <div className="text-5xl mb-4">📍</div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">
              現在アクティブなセッションはありません
            </h2>
            <p className="text-slate-400 text-sm mb-8">
              マイパスのQRコードを使って、お近くの店舗でチェックインしましょう
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/passes" className="btn-secondary">
                マイパスを見る
              </Link>
              <Link href="/venues" className="btn-primary">
                店舗を探す
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
