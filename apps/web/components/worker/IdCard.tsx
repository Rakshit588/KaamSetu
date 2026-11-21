'use client';

import { BadgeCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useT, type TKey } from '@/lib/i18n';
import type { TradeKey } from '@/lib/trades';
import { Logo } from '../Logo';

// The digital worker ID. The QR opens the worker's public profile (which accepts the digital ID).
export function IdCard({
  name,
  digitalId,
  trades,
  verified,
  trustScore,
  qrValue,
}: {
  name: string;
  digitalId: string;
  trades: TradeKey[];
  verified: boolean;
  trustScore: number;
  qrValue: string;
}) {
  const { t } = useT();
  return (
    <div className="grain relative overflow-hidden rounded-xl3 bg-[#0B1F4B] p-6 text-[#FFF8E7] shadow-lift">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-saffron/30 blur-3xl" />
      <div className="flex items-start justify-between gap-3">
        <Logo tone="light" />
        {verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-mint/20 px-3 py-1 text-xs font-bold text-mint">
            <BadgeCheck size={14} /> {t('ui.verified')}
          </span>
        )}
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-display text-3xl font-semibold">{name || '—'}</p>
          <p className="mt-1 font-mono text-lg font-bold tracking-widest text-saffron">{digitalId}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {trades.map((k) => (
              <li key={k} className="rounded-full bg-[#FFF8E7]/10 px-2.5 py-1 text-xs font-semibold">
                {t(`trade.${k}` as TKey)}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[#FFF8E7]/70">
            {t('ui.trust')}: <span className="font-bold text-[#FFF8E7]">{trustScore}</span>
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-white p-2.5">
          <QRCodeSVG value={qrValue || digitalId} size={104} level="M" fgColor="#0B1F4B" />
        </div>
      </div>
      <p className="mt-4 text-center text-[11px] text-[#FFF8E7]/60">{t('wid.scan')}</p>
    </div>
  );
}
