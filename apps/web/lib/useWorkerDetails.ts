'use client';

import { useEffect, useState } from 'react';
import { api } from './api';
import type { WorkerDetail } from './booking';

const cache = new Map<string, WorkerDetail>();

// Loads name and location for a list of worker ids, once each. Returns a getter that re-renders as data arrives.
export function useWorkerDetails(ids: string[]) {
  const [, bump] = useState(0);
  const key = ids.join(',');

  useEffect(() => {
    const missing = ids.filter((id) => !cache.has(id));
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(
      missing.map((id) =>
        api<WorkerDetail>(`/workers/${id}`)
          .then((d) => {
            cache.set(id, d);
          })
          .catch(() => undefined),
      ),
    ).then(() => {
      if (!cancelled) bump((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (id: string) => cache.get(id);
}
