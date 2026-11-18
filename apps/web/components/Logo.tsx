export function Logo({ className = '', tone = 'default' }: { className?: string; tone?: 'default' | 'light' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
        <defs>
          <linearGradient id="ks-logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#F97316" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#ks-logo-grad)" />
        <path d="M6 27 Q20 5 34 27" fill="none" stroke="#0B1F4B" strokeWidth="3" strokeLinecap="round" />
        <path d="M5 29 H35" stroke="#0B1F4B" strokeWidth="3" strokeLinecap="round" />
        <path d="M13 19 V29 M20 16 V29 M27 19 V29" stroke="#0B1F4B" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span
        className={`font-display text-[22px] font-semibold leading-none tracking-tight ${
          tone === 'light' ? 'text-[#FFF8E7]' : 'text-ink'
        }`}
      >
        Kaam<span className="text-saffron">सेतु</span>
      </span>
    </span>
  );
}
