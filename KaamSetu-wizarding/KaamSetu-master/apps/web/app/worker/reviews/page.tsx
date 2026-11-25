'use client';

import { Star } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StarRating } from '@/components/ui/StarRating';
import { TrustRing } from '@/components/ui/TrustRing';
import { api } from '@/lib/api';
import type { ReviewsPayload } from '@/lib/booking';
import { errorMessage } from '@/lib/errors';
import { asPercent, timeAgo } from '@/lib/format';
import { useT, type TKey } from '@/lib/i18n';
import type { WorkerProfileMe } from '@/lib/worker';

export default function WorkerReputationPage() {
  const { t, lang } = useT();
  const [profile, setProfile] = useState<WorkerProfileMe | null>(null);
  const [reviews, setReviews] = useState<ReviewsPayload | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api<{ profile: WorkerProfileMe }>('/workers/me');
      setProfile(res.profile);
      setError('');
      api<ReviewsPayload>(`/reviews/user/${res.profile.userId}`)
        .then(setReviews)
        .catch(() => setReviews({ summary: { count: 0, average: null }, items: [] }));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const status = profile.verification?.status ?? 'none';
  const completion = asPercent(profile.completionRate);
  const response = asPercent(profile.responseRate);

  // Each row: the real weight in the trust formula, and the worker's own number for it.
  const rows: { key: TKey; pct: number; value: string }[] = [
    { key: 'trust.rating', pct: 35, value: `${(profile.ratingAvg ?? 0).toFixed(1)} / 5 (${profile.ratingCount ?? 0})` },
    { key: 'trust.completion', pct: 20, value: `${completion}%` },
    { key: 'trust.verification', pct: 15, value: t(`wid.status.${status}` as TKey) },
    { key: 'trust.response', pct: 10, value: `${response}%` },
    { key: 'trust.experience', pct: 10, value: t('wr.jobs', { n: profile.jobsCompleted ?? 0 }) },
    { key: 'trust.punctuality', pct: 10, value: profile.onTimeRate != null ? `${asPercent(profile.onTimeRate)}%` : '—' },
  ];

  const tips: TKey[] = [];
  if (status !== 'verified') tips.push('wr.tipVerify');
  if ((profile.jobsCompleted ?? 0) < 5) tips.push('wr.tipJobs');
  if (response < 70) tips.push('wr.tipRespond');
  if ((profile.jobsCancelled ?? 0) > 0 && completion < 90) tips.push('wr.tipCancel');
  if ((profile.ratingCount ?? 0) < 3) tips.push('wr.tipRating');
  if (tips.length === 0) tips.push('wr.tipOk');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t('wr.title')}</h1>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <TrustRing value={profile.trustScore ?? 0} size={84} />
          <div>
            <h2 className="font-display text-xl font-semibold">{t('wr.how')}</h2>
            <p className="text-sm text-muted">{t('worker.trustText')}</p>
          </div>
        </div>
        <ul className="mt-5 space-y-3">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">
                  {t(r.key)} <span className="text-muted">· {r.pct}%</span>
                </span>
                <span className="font-semibold">{r.value}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/10">
                <div className="h-full rounded-full bg-gradient-to-r from-saffron to-flame" style={{ width: `${r.pct * 2.5}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">{t('wr.tips')}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
          {tips.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">{t('wr.reviews')}</h2>
        {!reviews ? (
          <Skeleton className="h-24" />
        ) : reviews.items.length === 0 ? (
          <EmptyState icon={Star} title={t('wr.noReviews')} text={t('wr.noReviewsText')} />
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
    </div>
  );
}
