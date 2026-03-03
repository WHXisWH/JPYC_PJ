'use client';

// APIヘルスチェックバッジ
// バックエンドAPIの接続状態をリアルタイムで表示する

import { useEffect, useState } from 'react';
import { createNodeStayClient } from '../services/nodestay';

export function HealthBadge() {
  // API接続状態：null=確認中、true=正常、false=エラー
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const client = createNodeStayClient();
    client
      .health()
      .then(() => setOk(true))
      .catch(() => setOk(false));
  }, []);

  // 確認中のスケルトン
  if (ok === null) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
        <span className="text-xs text-slate-400 font-medium">API 確認中</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
        ok
          ? 'bg-emerald-50 border border-emerald-100'
          : 'bg-red-50 border border-red-100'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          ok ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
        }`}
      />
      <span
        className={`text-xs font-semibold ${ok ? 'text-emerald-600' : 'text-red-600'}`}
      >
        API {ok ? '正常' : 'エラー'}
      </span>
    </div>
  );
}
