'use client';

import { GraduationCap, HandCoins, ShieldPlus, Users, type LucideIcon } from 'lucide-react';
import { useT, type TKey } from '@/lib/i18n';

const ITEMS: { icon: LucideIcon; title: TKey; text: TKey; tint: string }[] = [
  { icon: ShieldPlus, title: 'ws.insurance', text: 'ws.insuranceText', tint: 'bg-mint/15 text-mint' },
  { icon: HandCoins, title: 'ws.financing', text: 'ws.financingText', tint: 'bg-saffron/15 text-flame' },
  { icon: GraduationCap, title: 'ws.cert', text: 'ws.certText', tint: 'bg-brand/10 text-brand' },
  { icon: Users, title: 'ws.payroll', text: 'ws.payrollText', tint: 'bg-coral/15 text-coral' },
];

// Phase 3 of the roadmap. These are intentionally not built.
export default function WorkerSoonPage() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t('ws.title')}</h1>
        <p className="mt-1 text-muted">{t('ws.sub')}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title} className="card p-5">
              <span className={`grid h-12 w-12 place-items-center rounded-xl2 ${item.tint}`}>
                <Icon size={24} />
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold">{t(item.title)}</h2>
              <p className="mt-1 text-sm text-muted">{t(item.text)}</p>
              <span className="mt-4 inline-block rounded-full bg-line/10 px-3 py-1 text-xs font-bold text-muted">
                {t('ws.badge')}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
