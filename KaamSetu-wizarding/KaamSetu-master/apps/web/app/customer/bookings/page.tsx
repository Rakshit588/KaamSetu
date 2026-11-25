'use client';

import { CalendarCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { StatusChip } from '@/components/booking/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { ACTIVE_STATUSES, type Booking } from '@/lib/booking';
import { errorMessage } from '@/lib/errors';
import { formatDateTime, formatINR } from '@/lib/format';
import { useT, type TKey } from '@/lib/i18n';
import { useSocketEvent } from '@/lib/useSocketEvent';

export default function BookingsPage() {
  const { t, lang } = useT();
  const [items, setItems] = useState<Booking[] | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'active' | 'past'>('active');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api<{ items: Booking[] }>('/bookings/mine?limit=50');
      setItems(res.items);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useSocketEvent('job:status', () => void load());

  const list = (items ?? []).filter((b) => ACTIVE_STATUSES.includes(b.status) === (tab === 'active'));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t('history.title')}</h1>

      <div className="mt-5 flex w-fit rounded-full border border-line/10 bg-surface p-1 shadow-soft" role="tablist">
        {(['active', 'past'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-[44px] rounded-full px-6 text-sm font-semibold transition ${
              tab === k ? 'bg-brand text-bg' : 'text-muted hover:text-ink'
            }`}
          >
            {t(k === 'active' ? 'history.active' : 'history.past')}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : !items ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : list.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={t('history.empty')}
            text={t('history.emptyText')}
            action={
              <Link href="/customer" className="btn btn-primary">
                {t('history.findWorker')}
              </Link>
            }
          />
        ) : (
          list.map((b) => (
            <div key={b.id} className="card p-4">
              <Link href={`/customer/bookings/${b.id}`} className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{t(`trade.${b.trade}` as TKey)}</span>
                    <StatusChip status={b.status} />
                    {b.isEmergency && <span className="rounded-full bg-coral/15 px-2 py-0.5 text-xs font-bold text-coral">SOS</span>}
                  </span>
                  <span className="mt-1 block truncate text-sm text-muted">{b.address || '—'}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {b.createdAt ? formatDateTime(b.createdAt, lang) : ''}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-xl font-semibold">{formatINR(b.finalPrice)}</span>
                </span>
                <ChevronRight size={18} className="text-muted" />
              </Link>
              {b.workerId && (b.status === 'paid' || b.status === 'completed') && (
                <Link
                  href={`/customer/book?worker=${b.workerId}&trade=${b.trade}`}
                  className="btn btn-ghost mt-3 !min-h-[44px] !py-2 text-sm"
                >
                  {t('history.bookAgain')}
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
