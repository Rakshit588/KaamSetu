'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, MessageCircle, ReceiptIndianRupee } from 'lucide-react';

// These weights are the real trust score formula used by the API.
const weights = [
  { label: 'Average rating', pct: 35 },
  { label: 'Job completion', pct: 20 },
  { label: 'Verification level', pct: 15 },
  { label: 'Response speed', pct: 10 },
  { label: 'Experience', pct: 10 },
  { label: 'Punctuality', pct: 10 },
];

const points = [
  {
    icon: BadgeCheck,
    title: 'Verified, not just listed',
    text: 'Workers confirm their phone with an OTP and submit an ID that is reviewed. Verified workers get a badge and a higher trust score.',
  },
  {
    icon: MessageCircle,
    title: 'Ratings go both ways',
    text: 'Customers rate workers and workers rate customers, so good behaviour on both sides is visible.',
  },
  {
    icon: ReceiptIndianRupee,
    title: 'Prices you can read',
    text: 'You see a price range before you book, with worker pay and the 8% platform fee broken out.',
  },
];

export function Trust() {
  const reduce = useReducedMotion();
  const score = 86;
  const r = 52;
  const c = 2 * Math.PI * r;

  return (
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-6">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90" role="img" aria-label={`Sample trust score ${score} out of 100`}>
              <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="10" />
              <motion.circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke="#14B8A6"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={c}
                initial={{ strokeDashoffset: reduce ? c * (1 - score / 100) : c }}
                whileInView={{ strokeDashoffset: c * (1 - score / 100) }}
                viewport={{ once: true }}
                transition={{ duration: 1.3, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <span>
                <span className="block font-display text-4xl font-semibold">{score}</span>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">Trust score</span>
              </span>
            </div>
          </div>
          <div>
            <p className="font-display text-xl font-semibold">How the score is built</p>
            <p className="mt-1 text-sm text-muted">Sample worker. Every worker's score is explained, never a black box.</p>
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {weights.map((w) => (
            <li key={w.label}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{w.label}</span>
                <span className="text-muted">{w.pct}% of the score</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-saffron to-flame"
                  initial={{ width: reduce ? `${w.pct * 2.5}%` : 0 }}
                  whileInView={{ width: `${w.pct * 2.5}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ul className="space-y-4">
        {points.map((p) => {
          const Icon = p.icon;
          return (
            <li key={p.title} className="card flex gap-4 p-5 sm:p-6">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl2 bg-mint/15 text-mint">
                <Icon size={24} />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-muted">{p.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
