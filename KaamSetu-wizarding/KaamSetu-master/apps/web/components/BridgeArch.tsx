'use client';

import { motion } from 'framer-motion';
import { useId } from 'react';

// The "setu" (bridge) motif. `progress` 0..1 draws the arch, hangers and deck span by span.
export function BridgeArch({ progress = 1, className = '' }: { progress?: number; className?: string }) {
  const gid = `arch${useId().replace(/:/g, '')}`;
  const N = 14;
  const hangers = Array.from({ length: N - 1 }, (_, k) => {
    const t = (k + 1) / N;
    // Quadratic curve M20 150 Q300 -40 580 150: x = 20 + 560t, y = 150 - 380 t (1 - t)
    return { x: 20 + 560 * t, y: 150 - 380 * t * (1 - t), t };
  });
  const arch = 'M20 150 Q300 -40 580 150';

  return (
    <svg
      viewBox="0 0 600 190"
      className={className}
      role="img"
      aria-label="An arched bridge that is built span by span"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>

      <path d={arch} fill="none" stroke="currentColor" strokeOpacity={0.14} strokeWidth={5} strokeLinecap="round" />
      <rect x="0" y="150" width="600" height="10" rx="5" fill="currentColor" opacity={0.12} />
      <rect x="8" y="150" width="24" height="40" rx="6" fill="currentColor" opacity={0.16} />
      <rect x="568" y="150" width="24" height="40" rx="6" fill="currentColor" opacity={0.16} />

      {hangers.map((h) => (
        <motion.line
          key={h.x}
          x1={h.x}
          y1={h.y}
          x2={h.x}
          y2={150}
          stroke={`url(#${gid})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: h.t <= progress ? 1 : 0.1 }}
          transition={{ duration: 0.4, delay: h.t * 0.6 }}
        />
      ))}

      <motion.path
        d={arch}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: progress }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />
      <motion.rect
        x="0"
        y="150"
        height="10"
        rx="5"
        fill={`url(#${gid})`}
        initial={{ width: 0 }}
        animate={{ width: 600 * progress }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />
    </svg>
  );
}
