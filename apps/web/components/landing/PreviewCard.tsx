import { BadgeCheck, Siren, Star } from 'lucide-react';
import Link from 'next/link';

const pins = [
  { left: '16%', top: '58%', on: true },
  { left: '46%', top: '26%', on: true },
  { left: '70%', top: '64%', on: false },
  { left: '84%', top: '30%', on: true },
];

const reasons = ['Close to the job location', 'High trust score', 'Available now'];

// Illustrative preview of the real flow: nearby search, match reasons, transparent price.
export function PreviewCard() {
  const circumference = 2 * Math.PI * 15;
  const trust = 86;

  return (
    <div className="relative mx-auto w-full max-w-md sm:mb-10">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-saffron/25 via-transparent to-mint/20 blur-2xl" />

      <div className="card overflow-hidden p-4 shadow-lift sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Plumbers near you</p>
            <p className="font-display text-lg font-semibold">4 workers within 3 km</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-xs font-semibold text-mint">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-mint" />
              <span className="relative h-2 w-2 rounded-full bg-mint" />
            </span>
            Available now
          </span>
        </div>

        <div className="relative mt-4 h-44 overflow-hidden rounded-xl2 bg-surface2">
          <svg viewBox="0 0 320 176" preserveAspectRatio="none" className="absolute inset-0 h-full w-full text-ink" aria-hidden="true">
            <g fill="none" strokeLinecap="round">
              <path d="M-10 120 C80 90 140 150 330 70" stroke="currentColor" strokeOpacity="0.1" strokeWidth="12" />
              <path d="M60 -10 C90 60 70 120 110 190" stroke="currentColor" strokeOpacity="0.1" strokeWidth="12" />
              <path d="M220 -10 C200 50 260 110 240 190" stroke="currentColor" strokeOpacity="0.1" strokeWidth="12" />
              <path d="M-10 40 H330" stroke="currentColor" strokeOpacity="0.08" strokeWidth="8" />
            </g>
          </svg>

          <span className="absolute left-[48%] top-[52%] -translate-x-1/2 -translate-y-1/2">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand/40" />
            <span className="relative block h-3.5 w-3.5 rounded-full border-2 border-surface bg-brand" />
          </span>

          {pins.map((p, i) => (
            <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.left, top: p.top }}>
              {p.on && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-mint/60" />}
              <span
                className={`relative block h-3 w-3 rounded-full border-2 border-surface ${p.on ? 'bg-mint' : 'bg-muted'}`}
              />
            </span>
          ))}
        </div>

        <div className="mt-4 rounded-xl2 border border-line/10 bg-bg/60 p-3.5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-saffron to-flame font-display text-base font-semibold text-[#2a1600]">
              RK
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-semibold">
                Ramesh K.
                <BadgeCheck size={16} className="text-mint" aria-label="Verified" />
              </p>
              <p className="flex items-center gap-2 text-sm text-muted">
                Plumber · 4 yrs
                <span className="inline-flex items-center gap-1">
                  <Star size={13} className="fill-saffron text-saffron" /> 4.8
                </span>
              </p>
            </div>
            <div className="relative h-12 w-12 shrink-0" aria-label={`Trust score ${trust}`}>
              <svg viewBox="0 0 40 40" className="h-12 w-12 -rotate-90">
                <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="4" />
                <circle
                  cx="20"
                  cy="20"
                  r="15"
                  fill="none"
                  stroke="#14B8A6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(circumference * trust) / 100} ${circumference}`}
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-xs font-bold">{trust}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {reasons.map((r) => (
              <span key={r} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-line/10">
                {r}
              </span>
            ))}
          </div>

          <dl className="mt-3 space-y-1 border-t border-dashed border-line/15 pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Worker pay (2 hrs × ₹250)</dt>
              <dd>₹500</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Platform fee (8%)</dt>
              <dd>₹40</dd>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold">
              <dt>Total</dt>
              <dd>₹540</dd>
            </div>
          </dl>

          <Link href="/login?role=customer" className="btn btn-primary mt-3 w-full">
            Book Ramesh
          </Link>
        </div>

        <p className="mt-3 text-center text-[11px] text-muted">Illustrative preview. Names and prices are sample data.</p>
      </div>

      <div className="card absolute -bottom-12 -left-3 hidden items-center gap-2.5 px-3.5 py-2.5 shadow-lift sm:flex">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-coral/15 text-coral">
          <Siren size={18} />
        </span>
        <span className="text-sm leading-tight">
          <span className="block font-semibold">Emergency booking</span>
          <span className="text-muted">Nearby workers get 45 s to accept</span>
        </span>
      </div>
    </div>
  );
}
