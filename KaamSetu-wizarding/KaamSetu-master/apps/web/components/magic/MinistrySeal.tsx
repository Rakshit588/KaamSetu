import { useId } from 'react';

// "Ministry certified" mark for verified workers. Emerald field, gold ring, check in the middle.
// The label is always readable text next to it so the meaning never depends on the symbol alone.
export function MinistrySeal({ size = 44, className = '' }: { size?: number; className?: string }) {
  const id = `ms${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className={className}>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#4aa57c" />
          <stop offset="1" stopColor="#1f4f3a" />
        </radialGradient>
      </defs>
      <path
        d="M32 2 L38 8 L46 6 L49 14 L57 17 L55 25 L61 32 L55 39 L57 47 L49 50 L46 58 L38 56 L32 62 L26 56 L18 58 L15 50 L7 47 L9 39 L3 32 L9 25 L7 17 L15 14 L18 6 L26 8 Z"
        fill="#c6a15b"
      />
      <circle cx="32" cy="32" r="22" fill={`url(#${id})`} stroke="#ecd391" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="17.5" fill="none" stroke="#ecd391" strokeOpacity="0.5" strokeWidth="0.8" strokeDasharray="2 2.5" />
      <path d="M22 32.5 L29 39.5 L43 24.5" fill="none" stroke="#fdf1cf" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
