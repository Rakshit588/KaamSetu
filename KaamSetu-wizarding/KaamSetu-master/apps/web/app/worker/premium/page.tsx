'use client';

import { Check, Crown } from 'lucide-react';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { useT, type TKey } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

const BASIC: TKey[] = ['wp.f1', 'wp.f2'];
const PREMIUM: TKey[] = ['wp.f1', 'wp.f2', 'wp.f3', 'wp.f4', 'wp.f5'];

// Plan cards only. Buying a plan needs the subscriptions API, which is not built yet.
export default function WorkerPremiumPage() {
  const { t } = useT();
  useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t('wp.title')}</h1>
          <p className="mt-1 text-muted">{t('wp.sub')}</p>
        </div>
        <DemoBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card p-6 ring-2 ring-saffron">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-flame">{t('wp.current')}</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">{t('wp.basic')}</h2>
          <p className="mt-1 font-display text-3xl font-semibold">{t('wp.free')}</p>
          <ul className="mt-4 space-y-2">
            {BASIC.map((k) => (
              <li key={k} className="flex items-start gap-2 text-sm">
                <Check size={16} className="mt-0.5 shrink-0 text-mint" /> {t(k)}
              </li>
            ))}
          </ul>
        </section>

        <section className="card relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-saffron/25 blur-2xl" />
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
            <Crown size={22} className="text-saffron" /> {t('wp.premium')}
          </h2>
          <p className="mt-1 font-display text-3xl font-semibold">{t('wp.price')}</p>
          <p className="text-xs text-muted">{t('wp.demoPrice')}</p>
          <ul className="mt-4 space-y-2">
            {PREMIUM.map((k) => (
              <li key={k} className="flex items-start gap-2 text-sm">
                <Check size={16} className="mt-0.5 shrink-0 text-mint" /> {t(k)}
              </li>
            ))}
          </ul>
          <button type="button" disabled className="btn btn-primary mt-5 w-full opacity-60">
            {t('wp.upgrade')}
          </button>
        </section>
      </div>

      <p className="text-sm text-muted">{t('wp.note')}</p>
    </div>
  );
}
