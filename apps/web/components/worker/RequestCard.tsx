'use client';

import { Loader2, Siren } from 'lucide-react';
import type { Booking } from '@/lib/booking';
import { formatDistance, formatINR } from '@/lib/format';
import { haversineKm, toLatLng, type LatLng } from '@/lib/geo';
import { useT, type TKey } from '@/lib/i18n';

const WINDOW_SECONDS = 45;

type Props = {
  booking: Booking;
  workerPoint: LatLng | null;
  now: number;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

// One incoming job with its accept countdown. The server rejects accepts after acceptDeadlineAt.
export function RequestCard({ booking, workerPoint, now, busy, onAccept, onDecline }: Props) {
  const { t } = useT();
  const job = toLatLng(booking.location);
  const km = workerPoint && job ? haversineKm(workerPoint, job) : null;
  const left = booking.acceptDeadlineAt
    ? Math.max(0, Math.round((new Date(booking.acceptDeadlineAt).getTime() - now) / 1000))
    : null;
  const expired = left === 0;

  return (
    <article className={`card p-4 sm:p-5 ${booking.isEmergency ? 'ring-2 ring-coral/60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-display text-xl font-semibold">
            {t(`trade.${booking.trade}` as TKey)}
            {booking.isEmergency && (
              <span className="inline-flex items-center gap-1 rounded-full bg-coral/15 px-2 py-0.5 font-ui text-xs font-bold text-coral">
                <Siren size={12} /> {t('wk.sos')}
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-muted">
            {km !== null && <>{t('wk.away', { km: formatDistance(km) })} · </>}
            {booking.address || '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t('wk.youEarn')}</p>
          <p className="font-display text-2xl font-semibold">{formatINR(booking.workerPay)}</p>
        </div>
      </div>

      {left !== null && (
        <div className="mt-3" aria-live="off">
          <div className="h-2 overflow-hidden rounded-full bg-line/10">
            <div
              className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${left <= 10 ? 'bg-coral' : 'bg-gradient-to-r from-saffron to-flame'}`}
              style={{ width: `${Math.min(100, (left / WINDOW_SECONDS) * 100)}%` }}
            />
          </div>
          <p className={`mt-1 text-xs font-semibold ${expired ? 'text-coral' : 'text-muted'}`}>
            {expired ? t('wk.expired') : t('wk.secondsLeft', { s: left })}
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onDecline} disabled={busy} className="btn btn-ghost flex-1 disabled:opacity-60">
          {t('wk.decline')}
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={busy || expired}
          className="btn btn-primary flex-[2] disabled:opacity-60"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : t('wk.accept')}
        </button>
      </div>
    </article>
  );
}
