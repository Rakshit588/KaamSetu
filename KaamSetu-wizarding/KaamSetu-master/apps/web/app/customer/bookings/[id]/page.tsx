'use client';

import { ArrowLeft, Loader2, Siren, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ChatPanel } from '@/components/booking/ChatPanel';
import { ReviewForm } from '@/components/booking/ReviewForm';
import { StatusBridge } from '@/components/booking/StatusBridge';
import { StatusChip } from '@/components/booking/StatusChip';
import { MapView } from '@/components/map/MapView';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrustRing } from '@/components/ui/TrustRing';
import { api } from '@/lib/api';
import type { Booking, WorkerDetail } from '@/lib/booking';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { formatDateTime, formatINR, initials } from '@/lib/format';
import { toLatLng } from '@/lib/geo';
import { useT, type TKey } from '@/lib/i18n';
import { getSocket } from '@/lib/socket';
import { useSocketEvent } from '@/lib/useSocketEvent';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useT();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [worker, setWorker] = useState<WorkerDetail | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const res = await api<{ booking: Booking }>(`/bookings/${id}`);
      setBooking(res.booking);
      setError('');
    } catch (e) {
      setError(errorMessage(e, t('track.notFound')));
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  // Worker details once someone has accepted.
  const workerId = booking?.workerId ?? null;
  useEffect(() => {
    if (!workerId) return;
    let cancelled = false;
    api<WorkerDetail>(`/workers/${workerId}`)
      .then((w) => {
        if (!cancelled) setWorker(w);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [workerId]);

  // Live updates: join this booking's room, refresh on status events, and poll as a safety net.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const join = () => socket.emit('booking:join', id);
    join();
    socket.on('connect', join);
    return () => {
      socket.off('connect', join);
    };
  }, [id]);

  useSocketEvent<{ bookingId?: string }>('job:status', (p) => {
    if (!p?.bookingId || p.bookingId === id) void load();
  });
  useSocketEvent('notification:new', () => void load());

  const status = booking?.status;
  useEffect(() => {
    if (!status || status === 'paid' || status === 'cancelled') return;
    const timer = setInterval(() => void load(), 8000);
    return () => clearInterval(timer);
  }, [status, load]);

  const waiting = Boolean(booking?.isEmergency && status === 'requested');
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [waiting]);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setActionError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!booking || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const jobPoint = toLatLng(booking.location);
  const workerPoint = toLatLng(worker?.profile.location);
  const pins = [
    ...(jobPoint ? [{ id: 'job', kind: 'job' as const, ...jobPoint }] : []),
    ...(workerPoint ? [{ id: 'worker', kind: 'worker' as const, available: true, ...workerPoint }] : []),
  ];
  const secondsLeft = booking.acceptDeadlineAt
    ? Math.max(0, Math.round((new Date(booking.acceptDeadlineAt).getTime() - now) / 1000))
    : 0;
  const timedOut = Boolean(booking.fallbackNotifiedAt);
  const canCancel = ['requested', 'accepted', 'on_the_way'].includes(booking.status);
  const workerName = worker?.user?.name ?? '';
  const paidOrder = Boolean(booking.payment?.orderId);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/customer/bookings" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} /> {t('track.back')}
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t(`trade.${booking.trade}` as TKey)}</h1>
          <p className="mt-1 text-sm text-muted">
            {booking.address || '—'}
            {booking.createdAt && <> · {formatDateTime(booking.createdAt, lang)}</>}
          </p>
        </div>
        <StatusChip status={booking.status} />
      </header>

      {waiting && (
        <section
          className={`rounded-xl3 border p-5 ${timedOut ? 'border-coral/40 bg-coral/10' : 'border-saffron/40 bg-saffron/10'}`}
          aria-live="polite"
        >
          <p className="flex items-center gap-2 font-display text-xl font-semibold">
            {timedOut ? <TriangleAlert size={22} className="text-coral" /> : <Siren size={22} className="text-flame" />}
            {timedOut ? t('track.timeout') : t('track.emergencyWaiting')}
          </p>
          {timedOut ? (
            <p className="mt-1 text-sm text-muted">{t('track.timeoutText')}</p>
          ) : (
            <>
              <p className="mt-1 text-sm">
                {t('track.alerted', { n: booking.notifiedWorkerIds?.length ?? 0, km: booking.broadcastRadiusKm ?? 2 })}
              </p>
              {secondsLeft > 0 && <p className="mt-1 text-sm text-muted">{t('track.acceptIn', { s: secondsLeft })}</p>}
            </>
          )}
        </section>
      )}

      {booking.status === 'cancelled' && (
        <p className="rounded-xl3 bg-coral/10 p-4 font-semibold text-coral">{t('track.cancelledText')}</p>
      )}
      {booking.status === 'disputed' && (
        <p className="rounded-xl3 bg-coral/10 p-4 font-semibold text-coral">{t('track.disputedText')}</p>
      )}
      {!['cancelled', 'disputed'].includes(booking.status) && <StatusBridge status={booking.status} />}

      {(booking.status === 'accepted' || booking.status === 'on_the_way') && booking.startOtp && (
        <section className="card p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t('track.startOtp')}</p>
          <p className="mt-2 font-mono text-5xl font-bold tracking-[0.3em]">{String(booking.startOtp)}</p>
          <p className="mt-2 text-sm text-muted">{t('track.startOtpHelp')}</p>
        </section>
      )}
      {booking.status === 'in_progress' && booking.completionOtp && (
        <section className="card p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t('track.endOtp')}</p>
          <p className="mt-2 font-mono text-5xl font-bold tracking-[0.3em]">{String(booking.completionOtp)}</p>
          <p className="mt-2 text-sm text-muted">{t('track.endOtpHelp')}</p>
        </section>
      )}

      {booking.workerId && (
        <section className="card flex items-center gap-4 p-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-saffron to-flame font-display text-lg font-semibold text-[#2a1600]">
            {initials(workerName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('track.worker')}</p>
            <p className="truncate font-semibold">{workerName || '—'}</p>
            {booking.etaMinutes ? <p className="text-sm text-muted">{t('track.eta', { n: booking.etaMinutes })}</p> : null}
            <Link href={`/customer/workers/${booking.workerId}`} className="text-sm font-semibold text-flame">
              {t('track.viewProfile')}
            </Link>
          </div>
          {worker && <TrustRing value={worker.profile.trustScore ?? 0} size={56} />}
        </section>
      )}

      {pins.length > 0 && (
        <section aria-label={t('track.jobLocation')}>
          <MapView center={jobPoint ?? { lat: 28.9845, lng: 77.7064 }} pins={pins} fitToPins className="h-56" />
        </section>
      )}

      {(booking.status === 'completed' || booking.status === 'paid') && (
        <section className="card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">{t('track.payTitle')}</h2>
            {booking.demoPayment !== false && <DemoBadge />}
          </div>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t('book.workerPay')}</dt>
              <dd>{formatINR(booking.workerPay)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t('book.fee')}</dt>
              <dd>{formatINR(booking.platformFee)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-dashed border-line/20 pt-2">
              <dt className="font-semibold">{t('book.total')}</dt>
              <dd className="font-display text-2xl font-semibold">{formatINR(booking.finalPrice)}</dd>
            </div>
          </dl>

          {booking.status === 'completed' && (
            <div className="mt-4 space-y-2">
              {!paidOrder ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act(() => api(`/bookings/${id}/pay`, { method: 'POST' }))}
                    className="btn btn-primary w-full disabled:opacity-70"
                  >
                    {busy && <Loader2 size={18} className="animate-spin" />} {t('track.pay')}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act(() => api(`/bookings/${id}/release`, { method: 'POST' }))}
                    className="w-full text-center text-sm font-semibold text-flame"
                  >
                    {t('track.alreadyPaid')}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">{t('track.payDone')}</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act(() => api(`/bookings/${id}/release`, { method: 'POST' }))}
                    className="btn btn-primary w-full disabled:opacity-70"
                  >
                    {busy && <Loader2 size={18} className="animate-spin" />} {t('track.release')}
                  </button>
                </>
              )}
            </div>
          )}
          {booking.status === 'paid' && (
            <p className="mt-4 font-semibold text-mint">
              {t('track.paidDone')}
              {booking.invoiceNumber && <span className="ml-2 text-sm font-normal text-muted">{t('track.invoice', { n: booking.invoiceNumber })}</span>}
            </p>
          )}
        </section>
      )}

      {(booking.status === 'completed' || booking.status === 'paid') && <ReviewForm bookingId={id} />}

      {booking.workerId && booking.status !== 'cancelled' && <ChatPanel bookingId={id} meId={user.id} />}

      {actionError && (
        <p role="alert" className="text-sm font-medium text-coral">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {canCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm(t('track.cancelConfirm'))) {
                void act(() => api(`/bookings/${id}/status`, { body: { to: 'cancelled', reason: 'Cancelled by customer' } }));
              }
            }}
            className="btn btn-ghost"
          >
            {t('track.cancel')}
          </button>
        )}
        {booking.status === 'completed' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const reason = window.prompt(t('track.reportPrompt'));
              if (reason && reason.trim()) {
                void act(() => api(`/bookings/${id}/status`, { body: { to: 'disputed', reason: reason.trim() } }));
              }
            }}
            className="btn btn-ghost"
          >
            {t('track.report')}
          </button>
        )}
      </div>

      {booking.statusTimeline && booking.statusTimeline.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold">{t('track.timeline')}</h2>
          <ol className="mt-3 space-y-2 border-l-2 border-line/15 pl-4">
            {[...booking.statusTimeline].reverse().map((e, i) => (
              <li key={`${e.status}-${e.at}-${i}`} className="text-sm">
                <span className="font-semibold">{t(`status.${e.status}` as TKey)}</span>
                <span className="text-muted"> · {formatDateTime(e.at, lang)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
