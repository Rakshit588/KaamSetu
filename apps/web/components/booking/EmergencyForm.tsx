'use client';

import { Loader2, Siren } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Booking, PriceBreakdown } from '@/lib/booking';
import { errorMessage } from '@/lib/errors';
import { useT, type TKey } from '@/lib/i18n';
import { DEFAULT_PLACE, loadPlace, savePlace, type Place } from '@/lib/location';
import { TRADES, type TradeKey } from '@/lib/trades';
import { MapView } from '../map/MapView';
import { PriceCard } from './PriceCard';

export function EmergencyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useT();
  const tradeParam = params.get('trade');

  const [trade, setTrade] = useState<TradeKey | ''>(() => TRADES.find((x) => x.key === tradeParam)?.key ?? '');
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

  // The surcharge is shown before anything is sent.
  useEffect(() => {
    if (!trade) {
      setPrice(null);
      return;
    }
    let cancelled = false;
    setPricing(true);
    api<{ breakdown: PriceBreakdown }>('/pricing/estimate', {
      auth: false,
      body: { trade, estimatedDurationHrs: 1, urgency: 'emergency' },
    })
      .then((r) => {
        if (!cancelled) setPrice(r.breakdown);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setPricing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trade]);

  const movePin = (next: Place) => {
    setPlace(next);
    savePlace(next);
  };

  async function find() {
    if (!trade) return;
    setBusy(true);
    setError('');
    try {
      const res = await api<{ booking: Booking; notifiedCount: number }>('/bookings/emergency', {
        body: {
          trade,
          description: notes.trim() || undefined,
          lng: place.lng,
          lat: place.lat,
          address: address.trim() || undefined,
          estimatedDurationHrs: 1,
        },
      });
      router.push(`/customer/bookings/${res.booking.id}`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-coral/15 text-coral">
          <Siren size={24} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t('emergency.title')}</h1>
          <p className="text-muted">{t('emergency.sub')}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <fieldset>
            <legend className="text-sm font-semibold">{t('emergency.pickTrade')}</legend>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TRADES.map((tr) => {
                const Icon = tr.icon;
                const on = trade === tr.key;
                return (
                  <li key={tr.key}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setTrade(tr.key)}
                      className={`flex w-full flex-col items-center gap-2 rounded-xl2 border p-3 text-center transition ${
                        on ? 'border-coral bg-coral/10' : 'border-line/15 bg-surface hover:border-line/30'
                      }`}
                    >
                      <span className={`grid h-11 w-11 place-items-center rounded-xl2 ${tr.tint}`}>
                        <Icon size={22} />
                      </span>
                      <span className="text-xs font-semibold leading-tight">{t(`trade.${tr.key}` as TKey)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <section className="space-y-3" aria-label={t('book.location')}>
            <h2 className="text-sm font-semibold">{t('book.location')}</h2>
            <MapView center={place} zoom={14} pickPin={place} onPickPinMove={movePin} className="h-56" />
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
              placeholder={t('emergency.notes')}
              aria-label={t('emergency.notes')}
              className="w-full rounded-xl2 border border-line/20 bg-surface p-3 outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/20"
            />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {trade ? <PriceCard breakdown={price} loading={pricing} /> : null}
          <p className="text-xs text-muted">{t('emergency.surchargeNote')}</p>
          {error && (
            <p role="alert" className="text-sm font-medium text-coral">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => void find()}
            disabled={busy || !trade}
            className="btn w-full bg-gradient-to-r from-coral to-flame text-white shadow-soft hover:brightness-105 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" /> {t('emergency.finding')}
              </>
            ) : (
              <>
                <Siren size={18} /> {t('emergency.find')}
              </>
            )}
          </button>
        </aside>
      </div>
    </div>
  );
}
