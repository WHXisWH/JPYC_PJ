/**
 * useSessionPage: セッション Controller（SPEC §8）。
 * セッション状態と checkout API を保持；View は props で表示のみ。
 */

import { useEffect, useRef, useState } from 'react';
import { createNodeStayClient } from '../services/nodestay';

export type SessionStatus = 'IN_USE' | 'OVERTIME' | 'ENDED';

export interface ActiveSession {
  sessionId: string;
  passId: string;
  planName: string;
  venueName: string;
  seatId: string;
  seatType: 'OPEN' | 'BOOTH' | 'FLAT' | 'VIP';
  checkInAt: string;
  baseDurationMinutes: number;
  basePriceMinor: number;
  status: SessionStatus;
}

export interface CheckoutResult {
  usedMinutes: number;
  chargesMinor: number;
}

export interface UseSessionPageReturn {
  session: ActiveSession | null;
  elapsed: number;
  checking: boolean;
  checkoutResult: CheckoutResult | null;
  handleCheckout: () => Promise<void>;
}

const MOCK_SESSION: ActiveSession = {
  sessionId: 'sess-001',
  passId: 'pass-001',
  planName: '3時間パック',
  venueName: '快適ネットカフェ 渋谷店',
  seatId: 'B-07',
  seatType: 'BOOTH',
  checkInAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  baseDurationMinutes: 180,
  basePriceMinor: 50000,
  status: 'IN_USE',
};

export function useSessionPage(): UseSessionPageReturn {
  const [session] = useState<ActiveSession | null>(MOCK_SESSION);
  const [elapsed, setElapsed] = useState(0);
  const [checking, setChecking] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!session) return;
    const calcElapsed = () =>
      Math.floor((Date.now() - new Date(session.checkInAt).getTime()) / 1000);
    setElapsed(calcElapsed());
    intervalRef.current = setInterval(() => setElapsed(calcElapsed()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session]);

  const handleCheckout = async () => {
    if (!session) return;
    setChecking(true);
    const client = createNodeStayClient();
    const idempotencyKey = `checkout-${session.sessionId}-${Date.now()}`;
    try {
      const result = await client.checkoutSession(
        { sessionId: session.sessionId },
        idempotencyKey
      ) as { usedMinutes?: number; chargesMinor?: number };
      const usedMinutes = result?.usedMinutes ?? Math.floor(elapsed / 60);
      const chargesMinor = result?.chargesMinor ?? session.basePriceMinor;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCheckoutResult({ usedMinutes, chargesMinor });
    } catch {
      alert('チェックアウトに失敗しました。スタッフにお声がけください。');
    } finally {
      setChecking(false);
    }
  };

  return {
    session,
    elapsed,
    checking,
    checkoutResult,
    handleCheckout,
  };
}
