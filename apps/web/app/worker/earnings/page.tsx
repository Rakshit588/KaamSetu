'use client';

import { Wallet } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { EarningsChart } from '@/components/worker/EarningsChart';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { formatDateTime, formatINR } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { useSocketEvent } from '@/lib/useSocketEvent';
import type { WalletMe } from '@/lib/worker';

export default function WorkerEarningsPage() {
  const { t, lang } = useT();
  const [data, setData] = useState<WalletMe | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api<WalletMe>('/wallet/me'));
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useSocketEvent('job:status', () => void load());

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t('we.title')}</h1>
        {data.demo && <DemoBadge />}
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card bg-gradient-to-br from-saffron/20 to-flame/10 p-5 sm:col-span-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            <Wallet size={14} /> {t('we.balance')}
          </p>
          <p className="mt-2 font-display text-4xl font-semibold">{formatINR(data.balance)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('we.total')}</p>
          <p className="mt-2 font-display text-3xl font-semibold">{formatINR(data.earningsTotal)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('we.pending')}</p>
          <p className="mt-2 font-display text-3xl font-semibold">{formatINR(data.pendingPayout)}</p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 text-center">
        {(
          [
            ['we.today', data.earnings.today],
            ['we.week', data.earnings.week],
            ['we.month', data.earnings.month],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t(key)}</p>
            <p className="mt-1 font-display text-xl font-semibold sm:text-2xl">{formatINR(value)}</p>
          </div>
        ))}
      </section>

      <section className="card p-5">
        <h2 className="font-display text-xl font-semibold">{t('we.chart')}</h2>
        <EarningsChart series={data.series} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">{t('we.payouts')}</h2>
        {data.transactions.length === 0 ? (
          <EmptyState icon={Wallet} title={t('we.noPayouts')} text={t('we.noPayoutsText')} />
        ) : (
          <ul className="card divide-y divide-line/10">
            {data.transactions.map((tx) => {
              const row = (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{tx.note || tx.type || '—'}</span>
                    <span className="text-xs text-muted">{formatDateTime(tx.at, lang)}</span>
                  </span>
                  <span className="font-display text-xl font-semibold text-mint">+{formatINR(tx.amount)}</span>
                </>
              );
              return (
                <li key={tx.id}>
                  {tx.bookingId ? (
                    <Link href={`/worker/jobs/${tx.bookingId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface2">
                      {row}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-muted">{t('we.demoNote')}</p>
      </section>
    </div>
  );
}
