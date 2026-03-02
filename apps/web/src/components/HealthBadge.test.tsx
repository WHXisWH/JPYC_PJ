import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthBadge } from './HealthBadge';

describe('HealthBadge', () => {
  it('renders checking state first', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as any,
    );
    render(<HealthBadge />);
    expect(screen.getByText('API: checking...')).toBeInTheDocument();
  });

  it('renders ok when API is healthy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as any,
    );
    render(<HealthBadge />);
    expect(await screen.findByText('API: ok')).toBeInTheDocument();
  });

  it('renders down when API is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('no', { status: 500 })) as any);
    render(<HealthBadge />);
    expect(await screen.findByText('API: down')).toBeInTheDocument();
  });
});
