'use client';

import type { PriceBreakdown } from '@/lib/booking';
import { formatINR } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { Skeleton } from '../ui/Skeleton';

export function PriceCard({ breakdown, loading }: { breakdown: PriceBreakdown | null; loading?: boolean }) {
  const { t } = useT();
  if (!breakdown) return <Skeleton className="h-44" />;

  return (
    <div className={`card p-5 transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading || undefined}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t('book.price')}</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">{t('book.workerPay')}</dt>
          <dd className="font-medium">{formatINR(breakdown.workerPay)}</dd>
        </div>
        {breakdown.urgencySurcharge > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted">{t('book.surcharge')}</dt>
            <dd className="font-medium">{formatINR(breakdown.urgencySurcharge)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">{t('book.fee')}</dt>
          <dd className="font-medium">{formatINR(breakdown.platformFee)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-line/20 pt-3">
          <dt className="font-semibold">{t('book.total')}</dt>
          <dd className="font-display text-3xl font-semibold">{formatINR(breakdown.total)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-muted">
        {t('book.range', { min: formatINR(breakdown.min), max: formatINR(breakdown.max) })}
      </p>
    </div>
  );
}
