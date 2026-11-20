'use client';

import { BadgeCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { MapView } from '@/components/map/MapView';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StarRating } from '@/components/ui/StarRating';
import { TrustRing } from '@/components/ui/TrustRing';
import { api } from '@/lib/api';
import type { ReviewsPayload, WorkerDetail } from '@/lib/booking';
import { errorMessage } from '@/lib/errors';
import { asPercent, formatDistance, formatINR, initials, timeAgo } from '@/lib/format';
import { haversineKm, toLatLng } from '@/lib/geo';
import { useT, type TKey } from '@/lib/i18n';
import { DEFAULT_PLACE, loadPlace, type Place } from '@/lib/location';

// The real trust score formula (same weights the API uses).
const TRUST_PARTS: { key: TKey; pct: number }[] = [
  { key: 'trust.rating', pct: 35 },
  { key: 'trust.completion', pct: 20 },
  { key: 'trust.verification', pct: 15 },
  { key: 'trust.response', pct: 10 },
  { key: 'trust.experience', pct: 10 },
  { key: 'trust.punctuality', pct: 10 },
];

export default function WorkerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useT();
  const [data, setData] = useState<WorkerDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewsPayload | null>(null);
  const [error, setError] = useState('');
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [tradeParam, setTradeParam] = useState<string | null>(null);

  useEffect(() => {
    setPlace(loadPlace());
    setTradeParam(new URLSearchParams(window.location.search).get('trade'));
  }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      const w = await api<WorkerDetail>(`/workers/${id}`);
      setData(w);
      api<ReviewsPayload>(`/reviews/user/${w.profile.userId}`)
        .then(setReviews)
        .catch(() => setReviews({ summary: { count: 0, average: null }, items: [] }));
    } catch (e) {
      setError(errorMessage(e, t('worker.notFound')));
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const p = data.profile;
  const name = data.user?.name ?? '';
  const point = toLatLng(p.location);
  const distance = point ? haversineKm(place, point) : null;
  const verified = p.verification?.status === 'verified';
  const trades = p.skills.map((s) => s.trade);
  const bookTrade = tradeParam && trades.includes(tradeParam as (typeof trades)[number]) ? tradeParam : trades[0];
  const bookHref = `/customer/book?worker=${p.userId}${bookTrade ? `&trade=${bookTrade}` : ''}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 md:pb-0">
      <section className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-saffron to-flame font-display text-2xl font-semibold text-[#2a1600]">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 font-display text-3xl font-semibold tracking-tight">
            {name || '—'}
            {verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2.5 py-1 font-ui text-xs font-bold text-mint">
                <BadgeCheck size={14} /> {t('ui.verified')}
              </span>
            ) : (
              <span className="rounded-full bg-line/10 px-2.5 py-1 font-ui text-xs font-semibold text-muted">
                {t('worker.notVerified')}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {p.digitalId}
            {distance !== null && <> · {t('worker.distance', { km: formatDistance(distance) })}</>}
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold">
            {p.isAvailableNow ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-mint" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-mint" />
                </span>
                <span className="text-mint">{t('ui.available')}</span>
              </>
            ) : (
              <span className="text-muted">{t('worker.unavailable')}</span>
            )}
          </p>
        </div>
        <Link href={bookHref} className="btn btn-primary hidden md:inline-flex">
          {t('worker.book', { name: name.split(' ')[0] })}
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('worker.rating')}</p>
          <p className="mt-1 flex items-center gap-1.5 font-display text-2xl font-semibold">
            <Star size={20} className="fill-saffron text-saffron" /> {(p.ratingAvg ?? 0).toFixed(1)}
          </p>
          <p className="text-xs text-muted">({p.ratingCount ?? 0})</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('worker.jobsDone', { n: '' }).trim()}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{p.jobsCompleted ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('worker.completion')}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{asPercent(p.completionRate)}%</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('worker.response')}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{asPercent(p.responseRate)}%</p>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <TrustRing value={p.trustScore ?? 0} size={72} />
          <div>
            <h2 className="font-display text-xl font-semibold">{t('worker.trustTitle')}</h2>
            <p className="text-sm text-muted">{t('worker.trustText')}</p>
          </div>
        </div>
        <ul className="mt-5 space-y-3">
          {TRUST_PARTS.map((part) => (
            <li key={part.key}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{t(part.key)}</span>
                <span className="text-muted">{part.pct}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/10">
                <div className="h-full rounded-full bg-gradient-to-r from-saffron to-flame" style={{ width: `${part.pct * 2.5}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {p.bio && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">{t('worker.about')}</h2>
          <p className="mt-2 leading-relaxed text-muted">{p.bio}</p>
        </section>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">{t('worker.skills')}</h2>
        <ul className="mt-3 divide-y divide-line/10">
          {p.skills.map((s) => (
            <li key={s.trade} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span>
                <span className="block font-semibold">{t(`trade.${s.trade}` as TKey)}</span>
                <span className="text-sm text-muted">{t('worker.years', { n: s.experienceYears })}</span>
              </span>
              <span className="font-semibold">
                {s.hourlyRate ? t('worker.perHour', { n: formatINR(s.hourlyRate) }) : t('worker.standardRate')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {point && (
        <section aria-label={t('worker.location')}>
          <MapView
            center={point}
            zoom={13}
            pins={[{ id: 'worker', kind: 'worker', available: Boolean(p.isAvailableNow), ...point }]}
            me={place}
            className="h-56"
          />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">{t('worker.reviews')}</h2>
        {!reviews ? (
          <Skeleton className="h-24" />
        ) : reviews.items.length === 0 ? (
          <EmptyState icon={Star} title={t('worker.noReviews')} />
        ) : (
          reviews.items.map((r) => (
            <article key={r.id} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <StarRating value={r.rating} size={16} />
                <span className="text-xs text-muted">{timeAgo(r.createdAt, lang)}</span>
              </div>
              {r.comment && <p className="mt-2">{r.comment}</p>}
              <p className="mt-2 text-sm text-muted">
                {r.fromName ?? '—'}
                {r.tags.length > 0 && <> · {r.tags.map((tag) => t(`tag.${tag}` as TKey)).join(', ')}</>}
              </p>
            </article>
          ))
        )}
      </section>

      <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-line/10 bg-bg/95 px-5 py-3 backdrop-blur-xl md:hidden">
        <Link href={bookHref} className="btn btn-primary w-full">
          {t('worker.book', { name: name.split(' ')[0] })}
        </Link>
      </div>
    </div>
  );
}
