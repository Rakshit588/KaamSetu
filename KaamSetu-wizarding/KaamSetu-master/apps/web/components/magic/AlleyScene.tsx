// Diagon Alley-style street at dusk: crooked timber-and-stone shopfronts, lit windows, hanging lanterns,
// fog bands and a crescent moon. Pure SVG with deterministic geometry (no images, no randomness),
// so it is light, crisp at any size and identical on server and client.
type B = { x: number; w: number; h: number; roof: 'peak' | 'tilt' | 'flat' | 'spire' };

const BUILDINGS: B[] = [
  { x: 0, w: 120, h: 250, roof: 'peak' },
  { x: 110, w: 90, h: 310, roof: 'spire' },
  { x: 190, w: 130, h: 230, roof: 'tilt' },
  { x: 310, w: 100, h: 290, roof: 'peak' },
  { x: 400, w: 140, h: 240, roof: 'flat' },
  { x: 530, w: 110, h: 330, roof: 'spire' },
  { x: 630, w: 130, h: 250, roof: 'tilt' },
  { x: 750, w: 100, h: 300, roof: 'peak' },
  { x: 840, w: 140, h: 235, roof: 'flat' },
  { x: 970, w: 100, h: 320, roof: 'spire' },
  { x: 1060, w: 140, h: 260, roof: 'peak' },
];
const BASE = 520;

function roofPath(b: B): string {
  const top = BASE - b.h;
  const r = b.x + b.w;
  const mid = b.x + b.w / 2;
  switch (b.roof) {
    case 'peak':
      return `M${b.x - 4} ${top} L${mid} ${top - 44} L${r + 4} ${top} Z`;
    case 'tilt':
      return `M${b.x - 4} ${top} L${b.x + 12} ${top - 36} L${r + 4} ${top - 8} L${r + 4} ${top} Z`;
    case 'spire':
      return `M${b.x - 2} ${top} L${mid - 6} ${top - 30} L${mid} ${top - 78} L${mid + 6} ${top - 30} L${r + 2} ${top} Z`;
    default:
      return `M${b.x - 3} ${top} L${b.x - 3} ${top - 10} L${r + 3} ${top - 10} L${r + 3} ${top} Z`;
  }
}

export function AlleyScene({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 560"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="al-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05070c" />
          <stop offset="0.55" stopColor="#0d1424" />
          <stop offset="1" stopColor="#1c2236" />
        </linearGradient>
        <radialGradient id="al-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#e9a94a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#e9a94a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="al-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c6a15b" stopOpacity="0" />
          <stop offset="1" stopColor="#c6a15b" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id="al-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141b2c" />
          <stop offset="1" stopColor="#0a0d15" />
        </linearGradient>
      </defs>

      <rect width="1200" height="560" fill="url(#al-sky)" />

      {/* stars */}
      <g fill="#f3e6c4">
        {Array.from({ length: 46 }, (_, i) => (
          <circle
            key={i}
            cx={(i * 97 + 31) % 1200}
            cy={(i * 53 + 17) % 190}
            r={i % 7 === 0 ? 1.7 : 1}
            opacity={0.35 + ((i * 13) % 6) / 10}
          />
        ))}
      </g>

      {/* crescent moon */}
      <g>
        <circle cx="980" cy="86" r="46" fill="url(#al-glow)" opacity="0.4" />
        <path d="M980 56 A30 30 0 1 0 1004 104 A24 24 0 1 1 980 56 Z" fill="#f3e6c4" />
      </g>

      {/* distant towers (castle on the hill) */}
      <g fill="#0b1019" opacity="0.9">
        <path d="M300 330 L300 200 L316 200 L316 176 L322 150 L328 176 L328 200 L344 200 L344 330 Z" />
        <path d="M560 340 L560 220 L572 220 L572 190 L580 160 L588 190 L588 220 L600 220 L600 340 Z" />
        <path d="M820 335 L820 235 L832 235 L832 205 L840 178 L848 205 L848 235 L860 235 L860 335 Z" />
      </g>

      {/* shopfronts */}
      {BUILDINGS.map((b, i) => {
        const top = BASE - b.h;
        const cols = Math.max(2, Math.floor(b.w / 34));
        const rows = Math.floor((b.h - 90) / 52);
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.h} fill="url(#al-wall)" />
            <path d={roofPath(b)} fill="#080b12" />
            {/* timber beams */}
            <g stroke="#2a2418" strokeWidth="3">
              <line x1={b.x} y1={top + 40} x2={b.x + b.w} y2={top + 40} />
              <line x1={b.x} y1={top + 40 + rows * 52} x2={b.x + b.w} y2={top + 40 + rows * 52} />
            </g>
            {/* windows: some lit, deterministic */}
            {Array.from({ length: rows }).flatMap((_, r) =>
              Array.from({ length: cols }).map((__, c) => {
                const lit = (i * 7 + r * 3 + c * 5) % 3 !== 0;
                const wx = b.x + 14 + c * ((b.w - 28) / cols);
                const wy = top + 56 + r * 52;
                return (
                  <g key={`${r}-${c}`}>
                    <rect x={wx} y={wy} width="16" height="26" rx="8" fill={lit ? '#f1b95a' : '#0e1220'} opacity={lit ? 0.92 : 1} className={lit ? 'flicker' : undefined} />
                    {lit && <rect x={wx - 8} y={wy - 8} width="32" height="42" rx="16" fill="url(#al-glow)" opacity="0.28" />}
                  </g>
                );
              }),
            )}
            {/* shop door + awning */}
            <rect x={b.x + b.w / 2 - 12} y={BASE - 54} width="24" height="54" rx="12" fill="#1a1308" stroke="#c6a15b" strokeOpacity="0.5" />
            <rect x={b.x + 6} y={BASE - 78} width={b.w - 12} height="10" fill="#7a2a28" opacity="0.85" />
          </g>
        );
      })}

      {/* hanging lanterns */}
      <g>
        {[90, 260, 470, 700, 910, 1110].map((x, i) => (
          <g key={x} className="flicker" style={{ animationDelay: `${i * 0.5}s` }}>
            <line x1={x} y1={BASE - 190} x2={x} y2={BASE - 160} stroke="#3a2f1c" strokeWidth="2" />
            <circle cx={x} cy={BASE - 144} r="46" fill="url(#al-glow)" opacity="0.7" />
            <rect x={x - 7} y={BASE - 160} width="14" height="22" rx="3" fill="#ffd98a" />
            <rect x={x - 9} y={BASE - 164} width="18" height="4" fill="#3a2f1c" />
          </g>
        ))}
      </g>

      {/* cobbled street */}
      <rect y={BASE} width="1200" height="40" fill="#0a0d15" />
      <rect y={BASE} width="1200" height="2" fill="#c6a15b" opacity="0.35" />

      {/* fog */}
      <rect y="360" width="1200" height="200" fill="url(#al-fog)" />
      <g className="drift-slow" opacity="0.35">
        <ellipse cx="300" cy="500" rx="360" ry="26" fill="#c6a15b" opacity="0.18" />
        <ellipse cx="900" cy="486" rx="420" ry="30" fill="#c6a15b" opacity="0.16" />
      </g>
    </svg>
  );
}
