// Gold section divider: hairline, small diamond-and-star, hairline.
export function Ornament({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center gap-3 text-brand ${className}`}>
      <span className="rune-line h-px w-16 sm:w-28" />
      <svg width="30" height="14" viewBox="0 0 30 14" fill="currentColor">
        <path d="M15 0 L18 7 L15 14 L12 7 Z" />
        <path d="M2 7 L6 5 L8 7 L6 9 Z" opacity="0.7" />
        <path d="M28 7 L24 5 L22 7 L24 9 Z" opacity="0.7" />
      </svg>
      <span className="rune-line h-px w-16 sm:w-28" />
    </div>
  );
}
