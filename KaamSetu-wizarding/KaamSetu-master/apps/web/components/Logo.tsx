// KaamSetu mark: a gold arched bridge (the "setu") inside a hexagonal crest, set in Cinzel.
export function Logo({ className = '', tone = 'default' }: { className?: string; tone?: 'default' | 'light' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true">
        <defs>
          <linearGradient id="ks-logo-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ecd391" />
            <stop offset="0.55" stopColor="#c6a15b" />
            <stop offset="1" stopColor="#80633A" />
          </linearGradient>
        </defs>
        <path d="M10 2 H30 L39 20 L30 38 H10 L1 20 Z" fill="url(#ks-logo-grad)" />
        <path d="M11.5 4.8 H28.5 L36 20 L28.5 35.2 H11.5 L4 20 Z" fill="#090B10" />
        <path d="M9 26 Q20 8 31 26" fill="none" stroke="#C6A15B" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M8 28 H32" stroke="#C6A15B" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M14 20 V28 M20 17.5 V28 M26 20 V28" stroke="#E9DCC0" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M20 5.5 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1 -2.2 -2.2 -1 2.2 -1 z" fill="#ecd391" />
      </svg>
      <span
        className={`font-display text-[21px] font-semibold leading-none tracking-wide ${
          tone === 'light' ? 'text-[#E9DCC0]' : 'text-ink'
        }`}
      >
        Kaam<span className="gold-text">सेतु</span>
      </span>
    </span>
  );
}
