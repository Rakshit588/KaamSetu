'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useT, type TKey } from '@/lib/i18n';
import type { TradeKey } from '@/lib/trades';
import { Logo } from '../Logo';
import { MinistrySeal } from '../magic/MinistrySeal';

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
    <div className="relative overflow-hidden rounded-xl3 border border-[#C6A15B]/70 bg-[#0b1019] p-6 text-[#E9DCC0] shadow-lift">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#C6A15B]/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-2 rounded-[0.8rem] border border-[#C6A15B]/30" />
      <p className="relative mb-4 text-center font-display text-sm tracking-[0.25em] text-[#C6A15B]">OFFICIAL GUILD CREDENTIAL</p>
      <div className="flex items-start justify-between gap-3">
        <Logo tone="light" />
        {verified && (
          <span className="inline-flex items-center gap-2 rounded-full bg-[#48A87D]/20 py-1 pl-1.5 pr-3 text-xs font-bold text-[#7fd1a8]">
            <MinistrySeal size={26} /> {t('ui.verified')}
          </span>
        )}
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-display text-3xl font-semibold">{name || '—'}</p>
          <p className="mt-1 font-mono text-lg font-bold tracking-widest text-[#E2BE76]">{digitalId}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {trades.map((k) => (
              <li key={k} className="rounded-full bg-[#E9DCC0]/10 px-2.5 py-1 text-xs font-semibold">
                {t(`trade.${k}` as TKey)}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[#E9DCC0]/70">
            {t('ui.trust')}: <span className="font-bold text-[#E9DCC0]">{trustScore}</span>
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-[#F3E9D0] p-2.5">
          <QRCodeSVG value={qrValue || digitalId} size={104} level="M" fgColor="#090B10" />
        </div>
      </div>
      <p className="mt-4 text-center text-[11px] text-[#E9DCC0]/60">{t('wid.scan')}</p>
    </div>
  );
}
