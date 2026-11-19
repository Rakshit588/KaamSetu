// Circular trust score (0 to 100). Colour follows the score: mint, saffron, coral.
export function TrustRing({ value, size = 48 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const r = 15;
  const c = 2 * Math.PI * r;
  const tone = v >= 70 ? 'stroke-mint' : v >= 40 ? 'stroke-saffron' : 'stroke-coral';
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Trust score ${v}`}>
      <svg viewBox="0 0 40 40" width={size} height={size} className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="4" className="stroke-line/15" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className={`${tone} transition-[stroke-dasharray] duration-700`}
          strokeDasharray={`${(c * v) / 100} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-bold" style={{ fontSize: size * 0.3 }}>
        {v}
      </span>
    </span>
  );
}
