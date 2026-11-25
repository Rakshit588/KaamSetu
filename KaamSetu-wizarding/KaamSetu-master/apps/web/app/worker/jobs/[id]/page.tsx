'use client';

import { ArrowLeft, Loader2, TriangleAlert } from 'lucide-react';
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
import { OtpEntry } from '@/components/worker/OtpEntry';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Booking } from '@/lib/booking';
import { errorMessage } from '@/lib/errors';
import { formatDateTime, formatINR } from '@/lib/format';
import { toLatLng } from '@/lib/geo';
import { useT, type TKey } from '@/lib/i18n';
import { getSocket } from '@/lib/socket';
import { useSocketEvent } from '@/lib/useSocketEvent';

export default function WorkerJobPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useT();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ booking: Booking }>(`/bookings/${id}`);
      setBooking(res.booking);
      setError('');
    } catch (e) {
      setError(errorMessage(e, t('wk.job.notFound')));
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  // Join the booking room for live updates; poll as a safety net.
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

  const status = booking?.status;
  useEffect(() => {
    if (!status || status === 'paid' || status === 'cancelled') return;
    const timer = setInterval(() => void load(), 8000);
    return () => clearInterval(timer);
  }, [status, load]);

  const jobPoint = toLatLng(booking?.location);

  async function move(to: 'on_the_way' | 'in_progress' | 'completed', otp?: string) {
    setBusy(true);
    setActionError('');
    try {
      // Demo mode: the job's own coordinates stand in for the worker's GPS, so the 5 km check always passes.
      await api(`/bookings/${id}/status`, { body: { to, otp, lng: jobPoint?.lng, lat: jobPoint?.lat } });
      await load();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function cancelJob() {
    if (!window.confirm(t('wk.job.cancelWarn'))) return;
    setBusy(true);
    setActionError('');
    try {
      await api(`/bookings/${id}/decline`, { method: 'POST' });
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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/worker" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} /> {t('nav.home')}
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t(`trade.${booking.trade}` as TKey)}</h1>
          <p className="mt-1 text-sm text-muted">{booking.address || '—'}</p>
        </div>
        <StatusChip status={booking.status} />
      </header>

      {booking.status === 'cancelled' && (
        <p className="flex items-center gap-2 rounded-xl3 bg-coral/10 p-4 font-semibold text-coral">
          <TriangleAlert size={18} /> {t('track.cancelledText')}
        </p>
      )}
      {booking.status === 'disputed' && (
        <p className="rounded-xl3 bg-coral/10 p-4 font-semibold text-coral">{t('track.disputedText')}</p>
      )}
      {!['cancelled', 'disputed', 'requested'].includes(booking.status) && <StatusBridge status={booking.status} />}

      {booking.status === 'requested' && (
        <p className="card p-4 text-sm text-muted">{t('track.waiting')}</p>
      )}

      {booking.status === 'accepted' && (
        <button type="button" onClick={() => void move('on_the_way')} disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
          {busy ? <Loader2 size={18} className="animate-spin" /> : t('wk.job.onTheWay')}
        </button>
      )}

      {booking.status === 'on_the_way' && (
        <div className="space-y-2">
          <OtpEntry
            help={t('wk.job.startHelp')}
            submitLabel={t('wk.job.start')}
            busy={busy}
            onSubmit={(code) => void move('in_progress', code)}
          />
          <DemoBadge />
          <span className="ml-2 text-xs text-muted">{t('wk.job.gpsDemo')}</span>
        </div>
      )}

      {booking.status === 'in_progress' && (
        <OtpEntry
          help={t('wk.job.completeHelp')}
          submitLabel={t('wk.job.complete')}
          busy={busy}
          onSubmit={(code) => void move('completed', code)}
        />
      )}

      {booking.status === 'completed' && <p className="card p-4 font-semibold">{t('wk.job.waitingPay')}</p>}
      {booking.status === 'paid' && (
        <p className="card p-4 font-semibold text-mint">{t('wk.job.paid', { amount: formatINR(booking.workerPay) })}</p>
      )}

      {actionError && (
        <p role="alert" className="text-sm font-medium text-coral">
          {actionError}
        </p>
      )}

      <section className="card p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('wk.youEarn')}</dt>
            <dd className="mt-1 font-display text-3xl font-semibold">{formatINR(booking.workerPay)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('wk.job.duration')}</dt>
            <dd className="mt-1 font-semibold">{t('book.hours', { n: booking.estimatedDurationHrs ?? 1 })}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('wk.job.when')}</dt>
            <dd className="mt-1 font-semibold">
              {booking.scheduledFor ? formatDateTime(booking.scheduledFor, lang) : t('wk.job.now')}
            </dd>
          </div>
          {booking.description && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('wk.job.notes')}</dt>
              <dd className="mt-1">{booking.description}</dd>
            </div>
          )}
        </dl>
      </section>

      {jobPoint && (
        <section aria-label={t('track.jobLocation')}>
          <MapView center={jobPoint} zoom={15} pins={[{ id: 'job', kind: 'job', ...jobPoint }]} className="h-56" />
        </section>
      )}

      {!['requested', 'cancelled'].includes(booking.status) && <ChatPanel bookingId={id} meId={user.id} />}

      {(booking.status === 'completed' || booking.status === 'paid') && (
        <ReviewForm bookingId={id} title={t('wk.job.rateCustomer')} tags={['punctual', 'polite']} />
      )}

      {booking.status === 'accepted' && (
        <button type="button" onClick={() => void cancelJob()} disabled={busy} className="btn btn-ghost">
          {t('wk.job.cancel')}
        </button>
      )}
    </div>
  );
}
