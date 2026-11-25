'use client';

import { ArrowLeft, ArrowRight, Crosshair, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { formatINR } from '@/lib/format';
import { useT, type TKey } from '@/lib/i18n';
import { DEFAULT_PLACE, type Place } from '@/lib/location';
import { TRADES, type TradeKey } from '@/lib/trades';
import { TRADE_RATES } from '@/lib/tradeRates';
import { useGeolocation } from '@/lib/useGeolocation';
import { BridgeArch } from '../BridgeArch';
import { MapView } from '../map/MapView';

type Pick = { years: number; rate: number };

// Three steps: trades and rates, where you work from, a short bio. Saves with PUT /workers/me.
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const geo = useGeolocation();
  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState<Partial<Record<TradeKey, Pick>>>({});
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [radius, setRadius] = useState(10);
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (geo.status === 'ok' && geo.coords) setPlace(geo.coords);
  }, [geo.status, geo.coords]);

  const toggle = (key: TradeKey) =>
    setPicked((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { years: 2, rate: TRADE_RATES[key].base };
      return next;
    });

  const update = (key: TradeKey, patch: Partial<Pick>) =>
    setPicked((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key]!, ...patch } } : prev));

  const pickedKeys = Object.keys(picked) as TradeKey[];

  function next() {
    setError('');
    if (step === 1 && pickedKeys.length === 0) {
      setError(t('wk.ob.pickOne'));
      return;
    }
    setStep((s) => s + 1);
  }

  async function finish() {
    setBusy(true);
    setError('');
    try {
      await api('/workers/me', {
        method: 'PUT',
        body: {
          skills: pickedKeys.map((k) => ({
            trade: k,
            experienceYears: picked[k]!.years,
            hourlyRate: picked[k]!.rate,
          })),
          location: { lng: place.lng, lat: place.lat },
          serviceRadiusKm: radius,
          bio: bio.trim() || undefined,
        },
      });
      onDone();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">{t('wk.ob.step', { n: step })}</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">{t('wk.ob.title')}</h1>
      <BridgeArch progress={step / 3} className="mt-4 w-full max-w-md text-brand" />

      {step === 1 && (
        <section className="mt-6">
          <h2 className="font-display text-xl font-semibold">{t('wk.ob.trades')}</h2>
          <p className="mt-1 text-sm text-muted">{t('wk.ob.tradesHelp')}</p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TRADES.map((tr) => {
              const Icon = tr.icon;
              const on = Boolean(picked[tr.key]);
              return (
                <li key={tr.key}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(tr.key)}
                    className={`flex w-full flex-col items-center gap-2 rounded-xl2 border p-3 text-center transition ${
                      on ? 'border-saffron bg-saffron/10 shadow-soft' : 'border-line/15 bg-surface hover:border-line/30'
                    }`}
                  >
                    <span className={`grid h-12 w-12 place-items-center rounded-xl2 ${tr.tint}`}>
                      <Icon size={24} />
                    </span>
                    <span className="text-xs font-semibold leading-tight">{t(`trade.${tr.key}` as TKey)}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 space-y-4">
            {pickedKeys.map((key) => {
              const band = TRADE_RATES[key];
              const p = picked[key]!;
              return (
                <div key={key} className="card p-4">
                  <p className="font-semibold">{t(`trade.${key}` as TKey)}</p>
                  <label className="mt-3 block text-sm font-medium" htmlFor={`years-${key}`}>
                    {t('wk.ob.experience')}
                  </label>
                  <input
                    id={`years-${key}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={50}
                    value={p.years}
                    onChange={(e) => update(key, { years: Math.max(0, Math.min(50, Number(e.target.value) || 0)) })}
                    className="mt-1 h-12 w-28 rounded-xl2 border border-line/20 bg-surface px-3 text-lg font-semibold outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/20"
                  />
                  <label className="mt-4 flex items-baseline justify-between text-sm font-medium" htmlFor={`rate-${key}`}>
                    <span>{t('wk.ob.rate')}</span>
                    <span className="font-display text-xl font-semibold">{formatINR(p.rate)}</span>
                  </label>
                  <input
                    id={`rate-${key}`}
                    type="range"
                    min={band.min}
                    max={band.max}
                    step={5}
                    value={p.rate}
                    onChange={(e) => update(key, { rate: Number(e.target.value) })}
                    className="mt-2 w-full accent-[rgb(249_115_22)]"
                  />
                  <p className="mt-1 text-xs text-muted">
                    {t('wk.ob.rateHelp', { min: formatINR(band.min), max: formatINR(band.max) })}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-6 space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold">{t('wk.ob.where')}</h2>
            <p className="mt-1 text-sm text-muted">{t('wk.ob.whereHelp')}</p>
          </div>
          <MapView
            center={place}
            zoom={14}
            pickPin={place}
            onPickPinMove={setPlace}
            me={geo.status === 'ok' ? geo.coords : null}
            className="h-72"
          />
          <button type="button" onClick={geo.request} disabled={geo.status === 'loading'} className="btn btn-ghost !min-h-[44px] !py-2">
            {geo.status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={18} />}
            {geo.status === 'loading' ? t('customer.locating') : t('customer.useMyLocation')}
          </button>
          {(geo.status === 'denied' || geo.status === 'unsupported') && (
            <p role="status" className="text-sm font-medium text-coral">
              {t('customer.denied')}
            </p>
          )}
          <fieldset>
            <legend className="text-sm font-semibold">{t('wk.ob.radius')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[3, 5, 10, 15, 25].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={radius === n}
                  onClick={() => setRadius(n)}
                  className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold ${
                    radius === n ? 'border-saffron bg-saffron/15' : 'border-line/20 bg-surface'
                  }`}
                >
                  {n} km
                </button>
              ))}
            </div>
          </fieldset>
        </section>
      )}

      {step === 3 && (
        <section className="mt-6">
          <label htmlFor="bio" className="font-display text-xl font-semibold">
            {t('wk.ob.bio')}
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={5}
            placeholder={t('wk.ob.bioPlaceholder')}
            className="mt-3 w-full rounded-xl2 border border-line/20 bg-surface p-3 outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/20"
          />
          <ul className="mt-4 flex flex-wrap gap-2">
            {pickedKeys.map((k) => (
              <li key={k} className="rounded-full bg-saffron/15 px-3 py-1 text-sm font-semibold">
                {t(`trade.${k}` as TKey)} · {formatINR(picked[k]!.rate)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-coral">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="btn btn-ghost">
            <ArrowLeft size={18} /> {t('common.back')}
          </button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <button type="button" onClick={next} className="btn btn-primary">
            {t('wk.ob.next')} <ArrowRight size={18} />
          </button>
        ) : (
          <button type="button" onClick={() => void finish()} disabled={busy} className="btn btn-primary disabled:opacity-70">
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" /> {t('wk.ob.saving')}
              </>
            ) : (
              t('wk.ob.finish')
            )}
          </button>
        )}
      </div>
    </div>
  );
}
