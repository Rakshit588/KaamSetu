'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Booking } from '@/lib/booking';
import { errorMessage } from '@/lib/errors';
import { formatINR } from '@/lib/format';
import { toLatLng } from '@/lib/geo';
import { useT, type TKey } from '@/lib/i18n';
import { emitSocket } from '@/lib/socket';
import { useSocketEvent } from '@/lib/useSocketEvent';
import type { WalletMe, WorkerProfileMe } from '@/lib/worker';
import { StatusChip } from '../booking/StatusChip';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { TrustRing } from '../ui/TrustRing';
import { AvailabilityToggle } from './AvailabilityToggle';
import { RequestCard } from './RequestCard';

const ACTIVE = ['accepted', 'on_the_way', 'in_progress'];

export function WorkerHome({ profile, onProfileChange }: { profile: WorkerProfileMe; onProfileChange: (p: WorkerProfileMe) => void }) {
  const { t } = useT();
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<Booking[] | null>(null);
  const [active, setActive] = useState<Booking | null>(null);
  const [wallet, setWallet] = useState<WalletMe | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [message, setMessage] = useState('');

  const loadRequests = useCallback(async () => {
    try {
      const r = await api<{ items: Booking[] }>('/bookings/requests/open');
      setRequests(r.items);
    } catch {
      setRequests((prev) => prev ?? []);
    }
  }, []);

  const loadActive = useCallback(async () => {
    try {
      const r = await api<{ items: Booking[] }>('/bookings/mine?limit=20');
      setActive(r.items.find((b) => ACTIVE.includes(b.status)) ?? null);
    } catch {
      /* keep the last known value */
    }
  }, []);

  const loadWallet = useCallback(async () => {
    try {
      setWallet(await api<WalletMe>('/wallet/me'));
    } catch {
      /* the earnings card stays empty */
    }
  }, []);

  useEffect(() => {
    void loadRequests();
    void loadActive();
    void loadWallet();
  }, [loadRequests, loadActive, loadWallet]);

  // New requests and status changes arrive over the socket; polling is only a safety net.
  useSocketEvent('job:request', () => void loadRequests());
  useSocketEvent('job:status', () => {
    void loadRequests();
    void loadActive();
    void loadWallet();
  });

  useEffect(() => {
    const poll = setInterval(() => {
      void loadRequests();
      void loadActive();
    }, 10_000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [loadRequests, loadActive]);

  async function toggle(next: boolean) {
    setToggling(true);
    setMessage('');
    onProfileChange({ ...profile, isAvailableNow: next });
    try {
      await api('/workers/me/availability', { method: 'PUT', body: { isAvailableNow: next } });
      emitSocket('availability:update', next); // lets customers see the change live
    } catch {
      onProfileChange({ ...profile, isAvailableNow: !next });
      setMessage(t('wk.toggleFailed'));
    } finally {
      setToggling(false);
    }
  }

  async function accept(id: string) {
    setBusyId(id);
    setMessage('');
    try {
      await api(`/bookings/${id}/accept`, { method: 'POST' });
      router.push(`/worker/jobs/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ALREADY_ACCEPTED') setMessage(t('wk.errTaken'));
      else if (e instanceof ApiError && e.code === 'ACCEPT_EXPIRED') setMessage(t('wk.errExpired'));
      else setMessage(errorMessage(e));
      void loadRequests();
    } finally {
      setBusyId(null);
    }
  }

  async function decline(id: string) {
    setBusyId(id);
    try {
      await api(`/bookings/${id}/decline`, { method: 'POST' });
      setRequests((prev) => (prev ? prev.filter((b) => b.id !== id) : prev));
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  const workerPoint = toLatLng(profile.location);
  const firstName = user?.name?.split(' ')[0] || '';
  const open = (requests ?? []).filter((b) => !b.acceptDeadlineAt || new Date(b.acceptDeadlineAt).getTime() > now - 3000);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {t('wk.greeting', { name: firstName || '👋' })}
      </h1>

      <AvailabilityToggle value={profile.isAvailableNow} onChange={(v) => void toggle(v)} busy={toggling} />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Summary">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('wk.today')}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{wallet ? formatINR(wallet.earnings.today) : '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('wk.rating')}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{(profile.ratingAvg ?? 0).toFixed(1)}</p>
          <p className="text-xs text-muted">({profile.ratingCount ?? 0})</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('wk.jobsDone')}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{profile.jobsCompleted ?? 0}</p>
        </div>
        <div className="card flex items-center justify-between gap-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('wk.trust')}</p>
          <TrustRing value={profile.trustScore ?? 0} size={48} />
        </div>
      </section>

      {active && (
        <Link
          href={`/worker/jobs/${active.id}`}
          className="card flex items-center gap-3 border-saffron/50 p-4 transition hover:shadow-lift"
        >
          <span className="min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('wk.activeJob')}</span>
            <span className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-display text-xl font-semibold">{t(`trade.${active.trade}` as TKey)}</span>
              <StatusChip status={active.status} />
            </span>
            <span className="mt-0.5 block truncate text-sm text-muted">{active.address || '—'}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-flame">
            {t('wk.openJob')} <ChevronRight size={16} />
          </span>
        </Link>
      )}

      <section className="space-y-3" aria-label={t('wk.requests')}>
        <h2 className="font-display text-2xl font-semibold">{t('wk.requests')}</h2>
        {message && (
          <p role="alert" className="text-sm font-medium text-coral">
            {message}
          </p>
        )}
        {requests === null ? (
          <Skeleton className="h-40" />
        ) : open.length === 0 ? (
          <EmptyState title={t('wk.noRequests')} text={t('wk.noRequestsText')} />
        ) : (
          open.map((b) => (
            <RequestCard
              key={b.id}
              booking={b}
              workerPoint={workerPoint}
              now={now}
              busy={busyId === b.id}
              onAccept={() => void accept(b.id)}
              onDecline={() => void decline(b.id)}
            />
          ))
        )}
      </section>
    </div>
  );
}
