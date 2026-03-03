import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthBadge } from './HealthBadge';

// nodestay サービスモジュールをモック化
vi.mock('../services/nodestay');

describe('HealthBadge', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('最初に「API 確認中」が表示される', async () => {
    // health() が解決しない Promise を返す（確認中状態を維持）
    const { createNodeStayClient } = await import('../services/nodestay');
    vi.mocked(createNodeStayClient).mockReturnValue({
      health: () => new Promise(() => {}), // 永遠に解決しない
    } as ReturnType<typeof createNodeStayClient>);

    render(<HealthBadge />);
    expect(screen.getByText(/確認中/)).toBeInTheDocument();
  });

  it('API 正常時に「正常」バッジが表示される', async () => {
    const { createNodeStayClient } = await import('../services/nodestay');
    vi.mocked(createNodeStayClient).mockReturnValue({
      health: vi.fn().mockResolvedValue({ ok: true }),
    } as ReturnType<typeof createNodeStayClient>);

    render(<HealthBadge />);
    // 非同期で状態が更新されるまで待機
    expect(await screen.findByText(/正常/)).toBeInTheDocument();
  });

  it('API エラー時に「エラー」バッジが表示される', async () => {
    const { createNodeStayClient } = await import('../services/nodestay');
    vi.mocked(createNodeStayClient).mockReturnValue({
      health: vi.fn().mockRejectedValue(new Error('接続失敗')),
    } as ReturnType<typeof createNodeStayClient>);

    render(<HealthBadge />);
    // エラー状態になるまで待機
    expect(await screen.findByText(/エラー/)).toBeInTheDocument();
  });
});
