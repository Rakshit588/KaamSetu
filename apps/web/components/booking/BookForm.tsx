'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Booking, PriceBreakdown, WorkerDetail } from '@/lib/booking';
import { errorMessage } from '@/lib/errors';
import { initials } from '@/lib/format';
import { toLatLng } from '@/lib/geo';
import { useT, type TKey } from '@/lib/i18n';
import { DEFAULT_PLACE, loadPlace, savePlace, type Place } from '@/lib/location';
import { TRADES, type TradeKey } from '@/lib/trades';
import { MapView } from '../map/MapView';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { PriceCard } from './PriceCard';

const HOURS = [1, 2, 4, 8];

export function BookForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useT();
  const workerParam = params.get('worker');
  const tradeParam = params.get('trade');

  const [worker, setWorker] = useState<WorkerDetail | null>(null);
  const [workerError, setWorkerError] = useState('');
  const [trade, setTrade] = useState<TradeKey | ''>('');
  const [hours, setHours] = useState(2);
  const [when, setWhen] = useState<'now' | 'later'>('now');
  const [local, setLocal] = useState('');
  const [sameDay, setSameDay] = useState(false);
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState<PriceBreakdown | null>(null);
  const [pricing, setPricing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPlace(loadPlace());
  }, []);

  useEffect(() => {
    if (!workerParam) return;
    let cancelled = false;
    api<WorkerDetail>(`/workers/${workerParam}`)
      .then((w) => {
        if (cancelled) return;
        setWorker(w);
        const trades = w.profile.skills.map((s) => s.trade);
        const wanted = TRADES.find((x) => x.key === tradeParam)?.key;
        setTrade(wanted && trades.includes(wanted) ? wanted : (trades[0] ?? ''));
      })
      .catch((e) => {
        if (!cancelled) setWorkerError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [workerParam, tradeParam]);

  const scheduled = when === 'later' && local ? new Date(local) : null;
  const isNight = (() => {
    const h = (scheduled ?? new Date()).getHours();
    return h >= 21 || h < 6;
  })();

  // Live price estimate from the API, so the customer sees the fee before confirming.
  useEffect(() => {
    if (!worker || !trade) return;
    const handle = setTimeout(async () => {
      setPricing(true);
      try {
        const res = await api<{ breakdown: PriceBreakdown }>('/pricing/estimate', {
          auth: false,
          body: {
            trade,
            estimatedDurationHrs: hours,
            urgency: sameDay ? 'same_day' : 'normal',
            isNight,
            workerId: worker.profile.userId,
          },
        });
        setPrice(res.breakdown);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setPricing(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [worker, trade, hours, sameDay, isNight]);

  const movePin = (next: Place) => {
    setPlace(next);
    savePlace(next);
  };

  async function confirm() {
    if (!worker || !trade) return;
    setError('');
    if (when === 'later' && (!local || new Date(local).getTime() < Date.now() + 5 * 60 * 1000)) {
      setError(t('book.pickFuture'));
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ booking: Booking }>('/bookings', {
        body: {
          workerId: worker.profile.userId,
          trade,
          description: notes.trim() || undefined,
          lng: place.lng,
          lat: place.lat,
          address: address.trim() || undefined,
          scheduledFor: when === 'later' ? new Date(local).toISOString() : undefined,
          estimatedDurationHrs: hours,
          urgency: sameDay ? 'same_day' : 'normal',
          isNight,
        },
      });
      router.push(`/customer/bookings/${res.booking.id}`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  if (!workerParam) {
    return (
      <EmptyState
        title={t('book.pickWorker')}
        text={t('book.pickWorkerText')}
        action={
          <Link href="/customer" className="btn btn-primary">
            {t('history.findWorker')}
          </Link>
        }
      />
    );
  }
  if (workerError) return <ErrorState message={workerError} onRetry={() => router.refresh()} />;
  if (!worker) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const workerPoint = toLatLng(worker.profile.location);
  const name = worker.user?.name ?? '';
  const myTrades = worker.profile.skills.map((s) => s.trade);
  const minLocal = new Date(Date.now() + 10 * 60 * 1000 - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t('book.title')}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="card flex items-center gap-3 p-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-saffron to-flame font-display font-semibold text-[#2a1600]">
              {initials(name)}
            </span>
            <div>
              <p className="font-semibold">{name}</p>
              <p className="text-sm text-muted">{worker.profile.digitalId}</p>
            </div>
          </div>

          {myTrades.length > 1 && (
            <fieldset>
              <legend className="text-sm font-semibold">{t('book.service')}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {myTrades.map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={trade === k}
                    onClick={() => setTrade(k)}
                    className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold ${
                      trade === k ? 'border-saffron bg-saffron/15' : 'border-line/20 bg-surface'
                    }`}
                  >
                    {t(`trade.${k}` as TKey)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="text-sm font-semibold">{t('book.duration')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-pressed={hours === h}
                  onClick={() => setHours(h)}
                  className={`min-h-[44px] min-w-[64px] rounded-full border px-4 text-sm font-semibold ${
                    hours === h ? 'border-saffron bg-saffron/15' : 'border-line/20 bg-surface'
                  }`}
                >
                  {t('book.hours', { n: h })}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold">{t('book.when')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['now', 'later'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  aria-pressed={when === w}
                  onClick={() => setWhen(w)}
                  className={`min-h-[44px] rounded-full border px-5 text-sm font-semibold ${
                    when === w ? 'border-saffron bg-saffron/15' : 'border-line/20 bg-surface'
                  }`}
                >
                  {t(w === 'now' ? 'book.now' : 'book.later')}
                </button>
              ))}
            </div>
            {when === 'later' && (
              <input
                type="datetime-local"
                value={local}
                min={minLocal}
                onChange={(e) => setLocal(e.target.value)}
                aria-label={t('book.later')}
                className="mt-3 h-12 w-full rounded-xl2 border border-line/20 bg-surface px-4 outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/20 sm:w-auto"
              />
            )}
            <label className="mt-3 flex min-h-[44px] items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={sameDay}
                onChange={(e) => setSameDay(e.target.checked)}
                className="h-5 w-5 accent-[rgb(249_115_22)]"
              />
              {t('book.sameDay')}
            </label>
          </fieldset>

          <section aria-label={t('book.location')} className="space-y-3">
            <h2 className="text-sm font-semibold">{t('book.location')}</h2>
            <MapView
              center={place}
              zoom={14}
              pickPin={place}
              onPickPinMove={movePin}
              pins={workerPoint ? [{ id: 'worker', kind: 'worker', available: true, ...workerPoint }] : []}
              className="h-56"
            />
            <p className="text-xs text-muted">{t('customer.dragPin')}</p>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={300}
              placeholder={t('book.address')}
              aria-label={t('book.address')}
              className="h-12 w-full rounded-xl2 border border-line/20 bg-surface px-4 outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/20"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={t('book.notes')}
              aria-label={t('book.notes')}
              className="w-full rounded-xl2 border border-line/20 bg-surface p-3 outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/20"
            />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <PriceCard breakdown={price} loading={pricing} />
          {error && (
            <p role="alert" className="text-sm font-medium text-coral">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={busy || !price}
            className="btn btn-primary w-full disabled:opacity-70"
          >
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" /> {t('book.confirming')}
              </>
            ) : (
              t('book.confirm')
            )}
          </button>
          <p className="text-center text-xs text-muted">{t('book.payLater')}</p>
        </aside>
      </div>
    </div>
  );
}
