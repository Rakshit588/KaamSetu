import type { CSSProperties } from 'react';

// Floating candle-light motes behind every page. Decorative only: hidden from assistive tech,
// never intercepts clicks, and switched off by prefers-reduced-motion (see .mote in globals.css).
// Values are derived from the index so server and client render the same markup.
const MOTES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  size: 3 + ((i * 5) % 5),
  dur: 14 + ((i * 7) % 12),
  delay: -((i * 3) % 15),
  drift: ((i % 2 ? 1 : -1) * (14 + ((i * 11) % 40))),
}));

export function Ambient() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {MOTES.map((m, i) => (
        <span
          key={i}
          className={`mote ${i >= 7 ? 'hidden sm:block' : ''}`}
          style={
            {
              left: m.left,
              width: m.size,
              height: m.size,
              '--dur': `${m.dur}s`,
              '--delay': `${m.delay}s`,
              '--drift': `${m.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
