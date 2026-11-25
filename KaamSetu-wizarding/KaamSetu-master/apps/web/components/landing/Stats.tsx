'use client';

import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduce) {
      setValue(to);
      return;
    }
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

// These are fixed facts about how the product works. The API has no public statistics endpoint yet,
// so no live member or booking counts are shown (nothing is invented).
const stats = [
  { to: 8, suffix: '', label: 'Trades covered', magic: 'Guilds of the Marketplace' },
  { to: 8, suffix: '%', label: 'Flat platform fee', magic: 'The Gringotts levy, shown upfront' },
  { to: 45, suffix: ' s', label: 'Emergency accept window', magic: 'Owl Post Express' },
  { to: 0, suffix: '', label: 'Middlemen', magic: 'Direct, hand to hand' },
];

export function Stats() {
  return (
    <section aria-label="Key facts" className="py-10">
      <div className="container-x grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5 text-center sm:p-6">
            <p className="gold-text font-display text-4xl font-semibold sm:text-5xl">
              <CountUp to={s.to} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm font-semibold">{s.label}</p>
            <p className="mt-1 font-serif text-base italic text-muted">{s.magic}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
