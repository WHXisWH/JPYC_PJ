'use client';

import { useEffect, useState } from 'react';
import { createNodeStayClient } from '../services/nodestay';

export function HealthBadge() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const client = createNodeStayClient();
    client
      .health()
      .then(() => setOk(true))
      .catch(() => setOk(false));
  }, []);

  if (ok === null) return <p>API: checking...</p>;
  return <p>API: {ok ? 'ok' : 'down'}</p>;
}
