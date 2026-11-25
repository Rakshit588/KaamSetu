'use client';

import { formatINR } from '@/lib/format';
import { useT } from '@/lib/i18n';

// Seven bars, one per day. Plain SVG, no chart library.
export function EarningsChart({ series }: { series: { date: string; amount: number }[] }) {
  const { lang } = useT();
  const max = Math.max(1, ...series.map((s) => s.amount));
  const W = 320;
  const H = 150;
  const barW = 28;
  const gap = (W - barW * series.length) / (series.length + 1);
  const total = series.reduce((a, s) => a + s.amount, 0);
  const day = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short' });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`${formatINR(total)}`}
    >
      {series.map((s, i) => {
        const h = Math.round((s.amount / max) * 90);
        const x = gap + i * (barW + gap);
        const isToday = i === series.length - 1;
        return (
          <g key={s.date}>
            <title>{`${s.date}: ${formatINR(s.amount)}`}</title>
            <rect x={x} y={110 - Math.max(h, 3)} width={barW} height={Math.max(h, 3)} rx={8} className={s.amount > 0 ? (isToday ? 'fill-flame' : 'fill-saffron') : 'fill-line/15'} />
            {s.amount > 0 && (
              <text x={x + barW / 2} y={110 - h - 6} textAnchor="middle" className="fill-ink text-[10px] font-semibold">
                {formatINR(s.amount)}
              </text>
            )}
            <text x={x + barW / 2} y={130} textAnchor="middle" className="fill-muted text-[10px]">
              {day(s.date)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
