import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Page from './page';

describe('Page', () => {
  it('renders title', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as any,
    );
    render(<Page />);
    expect(screen.getByText('Node Stay')).toBeInTheDocument();
  });
});

