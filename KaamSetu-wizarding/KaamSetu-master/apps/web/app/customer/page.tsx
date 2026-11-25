'use client';

import { Crosshair, Loader2, Siren } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MapView } from '@/components/map/MapView';
import { useAuth } from '@/lib/auth';
import { useT, type TKey } from '@/lib/i18n';
import { DEFAULT_PLACE, loadPlace, savePlace, type Place } from '@/lib/location';
import { TRADES } from '@/lib/trades';
import { useGeolocation } from '@/lib/useGeolocation';

export default function CustomerHomePage() {
  const { t } = useT();
  const { user } = useAuth();
  const geo = useGeolocation();
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);

  useEffect(() => {
    setPlace(loadPlace());
  }, []);

  // When GPS answers, move the pin there.
  useEffect(() => {
    if (geo.status === 'ok' && geo.coords) {
      setPlace(geo.coords);
      savePlace(geo.coords);
    }
  }, [geo.status, geo.coords]);

  const movePin = (next: Place) => {
    setPlace(next);
    savePlace(next);
  };

  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div className="space-y-8">
      <div>
        <p className="font-serif text-xl italic text-brand">Welcome to Diagon Alley. Find the right skilled hands for every task.</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-wide sm:text-4xl">
          {t('customer.greeting', { name: firstName || '👋' })}
        </h1>
        <p className="mt-1 text-muted">{t('customer.whereTitle')}</p>
      </div>

      <Link
        href="/customer/emergency"
        className="group relative flex items-center gap-4 overflow-hidden rounded-xl3 border border-[#E2BE76]/50 p-5 text-[#fff4ee] shadow-lift transition hover:brightness-110 active:scale-[0.99]"
        style={{ backgroundImage: 'linear-gradient(100deg, #7f2724 0%, #a93b37 55%, #8a5a2a 100%)' }}
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[#E2BE76]/60 bg-black/25">
          <Siren size={28} />
        </span>
        <span>
          <span className="block font-display text-xl font-semibold">{t('customer.emergencyTitle')}</span>
          <span className="text-sm text-[#fff4ee]/90">{t('customer.emergencySub')}</span>
        </span>
      </Link>

      <section aria-label={t('customer.whereTitle')} className="space-y-3">
        <MapView
          center={place}
          zoom={14}
          pickPin={place}
          onPickPinMove={movePin}
          me={geo.status === 'ok' ? geo.coords : null}
          className="h-72 sm:h-96"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{t('customer.dragPin')}</p>
          <button type="button" onClick={geo.request} disabled={geo.status === 'loading'} className="btn btn-ghost !min-h-[44px] !py-2">
            {geo.status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={18} />}
            {geo.status === 'loading' ? t('customer.locating') : t('customer.useMyLocation')}
          </button>
        </div>
        {(geo.status === 'denied' || geo.status === 'unsupported') && (
          <p role="status" className="text-sm font-medium text-coral">
            {t('customer.denied')}
          </p>
        )}
      </section>

      <section aria-labelledby="trades-heading">
        <h2 id="trades-heading" className="font-display text-2xl font-semibold">
          {t('customer.pickTrade')}
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {TRADES.map((trade) => {
            const Icon = trade.icon;
            return (
              <li key={trade.key}>
                <Link
                  href={`/customer/search?trade=${trade.key}`}
                  className="card flex h-full flex-col items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className={`grid h-12 w-12 place-items-center rounded-xl2 ${trade.tint}`}>
                    <Icon size={24} />
                  </span>
                  <span className="font-semibold leading-tight">{t(`trade.${trade.key}` as TKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
