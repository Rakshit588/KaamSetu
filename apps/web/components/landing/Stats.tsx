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

// These are facts about how the product works, not marketing numbers.
const stats = [
  { to: 8, suffix: '', label: 'Trades covered', hint: 'Mason to repair technician' },
  { to: 8, suffix: '%', label: 'Flat platform fee', hint: 'Shown upfront, never hidden' },
  { to: 45, suffix: ' s', label: 'Emergency accept window', hint: 'Then the search widens' },
  { to: 0, suffix: '', label: 'Middlemen', hint: 'Direct worker to customer' },
];

export function Stats() {
  return (
    <section aria-label="Key facts" className="py-8">
      <div className="container-x grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5 text-center sm:p-6">
            <p className="font-display text-4xl font-semibold text-brand sm:text-5xl">
              <CountUp to={s.to} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm font-semibold">{s.label}</p>
            <p className="mt-1 text-xs text-muted">{s.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
