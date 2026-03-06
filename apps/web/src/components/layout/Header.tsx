'use client';

// ヘッダーコンポーネント（SPEC V7: UserService 経由で残高取得）
// ナビゲーション、ウォレット残高表示、モバイルメニューを管理する

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '../../stores/user.store';
import { UserService } from '../../services/user.service';

// ナビゲーション項目の定義
const NAV_ITEMS = [
  { href: '/', label: 'ホーム' },
  { href: '/venues', label: '店舗を探す' },
  { href: '/passes', label: 'マイパス' },
  { href: '/sessions', label: 'セッション' },
  { href: '/compute', label: '算力マーケット' },
] as const;

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const balance = useUserStore((s) => s.balance?.balanceMinor ?? null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    UserService.getBalance().catch(() => {});
  }, []);

  // モバイルメニューを閉じる
  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-2.5 group" onClick={closeMobile}>
            {/* アイコン */}
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* ノードアイコン */}
                <circle cx="12" cy="5" r="2" />
                <circle cx="5" cy="19" r="2" />
                <circle cx="19" cy="19" r="2" />
                <line x1="12" y1="7" x2="12" y2="12" />
                <line x1="12" y1="12" x2="5.5" y2="17.5" />
                <line x1="12" y1="12" x2="18.5" y2="17.5" />
              </svg>
            </div>
            {/* ブランド名 */}
            <span
              className={`font-bold text-lg tracking-tight transition-colors ${
                scrolled ? 'text-slate-900' : 'text-white'
              }`}
            >
              Node Stay
            </span>
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? scrolled
                        ? 'bg-brand-50 text-brand-600'
                        : 'bg-white/10 text-white'
                      : scrolled
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 右側：残高・接続ボタン */}
          <div className="hidden md:flex items-center gap-3">
            {/* JPYC残高表示 */}
            {balance !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  scrolled
                    ? 'bg-jpyc-50 text-jpyc-700'
                    : 'bg-white/10 text-white'
                }`}
              >
                <span className="text-base">¥</span>
                <span>{(balance / 100).toLocaleString('ja-JP')} JPYC</span>
              </div>
            )}
            {/* ウォレット接続ボタン */}
            <button className="btn-primary py-2 text-sm">
              ウォレット接続
            </button>
          </div>

          {/* モバイルハンバーガーボタン */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-white hover:bg-white/10'
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="メニューを開く"
          >
            {mobileOpen ? (
              // 閉じるアイコン
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="4" x2="18" y2="18" />
                <line x1="18" y1="4" x2="4" y2="18" />
              </svg>
            ) : (
              // ハンバーガーアイコン
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="19" y2="6" />
                <line x1="3" y1="12" x2="19" y2="12" />
                <line x1="3" y1="18" x2="19" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* モバイルメニュー（スライドダウン） */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 shadow-lg animate-fade-in">
          <div className="container-main py-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {/* モバイル用残高・ボタン */}
            <div className="pt-3 mt-2 border-t border-slate-100 flex flex-col gap-2">
              {balance !== null && (
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-jpyc-50 rounded-xl text-sm font-semibold text-jpyc-700">
                  <span>残高：{(balance / 100).toLocaleString('ja-JP')} JPYC</span>
                </div>
              )}
              <button className="btn-primary w-full">ウォレット接続</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
