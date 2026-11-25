'use client';

import { BadgeCheck, Star } from 'lucide-react';
import Link from 'next/link';
import type { WorkerDetail } from '@/lib/booking';
import { formatDistance, formatINR, initials } from '@/lib/format';
import { useT, type TKey } from '@/lib/i18n';
import type { MatchReason, SearchWorker } from '@/lib/search';
import type { TradeKey } from '@/lib/trades';
import { Skeleton } from '../ui/Skeleton';
import { TrustRing } from '../ui/TrustRing';

const KNOWN_REASONS = ['skill', 'distance', 'trust', 'availability', 'priceFit', 'pastSuccess', 'response'];

type Props = {
  w: SearchWorker;
  trade: TradeKey;
  hours: number;
  /** Name and location, fetched separately because the search API does not return them. */
  detail?: WorkerDetail;
  selected?: boolean;
  onSelect?: () => void;
};

export function WorkerCard({ w, trade, hours, detail, selected, onSelect }: Props) {
  const { t } = useT();
  const name = detail?.user?.name;
  const skill = w.skills.find((s) => s.trade === trade);
  const verified = w.verificationStatus === 'verified';
  const reasonText = (r: MatchReason) => (KNOWN_REASONS.includes(r.key) ? t(`match.${r.key}` as TKey) : r.label);
  const profileHref = `/customer/workers/${w.workerId}?trade=${trade}`;
  const bookHref = `/customer/book?worker=${w.workerId}&trade=${trade}`;

  return (
    <article
      onClick={onSelect}
      className={`card p-4 transition sm:p-5 ${selected ? 'ring-2 ring-saffron' : ''} ${onSelect ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-saffron to-flame font-display text-lg font-semibold text-[#2a1600]">
          {name ? initials(name) : 'KS'}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {name ? (
              <Link href={profileHref} className="truncate font-display text-lg font-semibold hover:underline">
                {name}
              </Link>
            ) : (
              <Skeleton className="h-5 w-32" />
            )}
            {verified && <BadgeCheck size={17} className="shrink-0 text-mint" aria-label={t('ui.verified')} />}
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {t(`trade.${trade}` as TKey)}
            {skill && <> · {t('worker.years', { n: skill.experienceYears })}</>} · {formatDistance(w.distanceKm)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold">
            {w.isAvailableNow ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-mint" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-mint" />
                </span>
                <span className="text-mint">{t('ui.available')}</span>
              </>
            ) : (
              <span className="text-muted">{t('search.busy')}</span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              w.matchScore >= 75 ? 'bg-mint/15 text-mint' : 'bg-saffron/15 text-flame'
            }`}
          >
            {t('search.match', { n: w.matchScore })}
          </span>
          <TrustRing value={w.trustScore} size={44} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1 font-semibold">
          <Star size={15} className="fill-saffron text-saffron" /> {w.ratingAvg.toFixed(1)}
          <span className="font-normal text-muted">({w.ratingCount})</span>
        </span>
        <span className="text-muted">{t('worker.jobsDone', { n: w.jobsCompleted })}</span>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {w.matchReasons.map((r) => (
          <li key={r.key} className="rounded-full bg-surface2 px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-line/10">
            {reasonText(r)}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-dashed border-line/15 pt-3">
        <div>
          <p className="font-display text-2xl font-semibold leading-none">{formatINR(w.price.total)}</p>
          <p className="mt-1 text-xs text-muted">
            {t('search.estimate', { n: hours })} · {formatINR(w.price.min)} to {formatINR(w.price.max)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={profileHref} className="btn btn-ghost !min-h-[44px] !px-4 !py-2 text-sm">
            {t('search.view')}
          </Link>
          <Link href={bookHref} className="btn btn-primary !min-h-[44px] !px-5 !py-2 text-sm">
            {t('search.bookNow')}
          </Link>
        </div>
      </div>
    </article>
  );
}
