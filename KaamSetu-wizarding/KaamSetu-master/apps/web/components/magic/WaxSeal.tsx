import type { ReactNode } from 'react';

// Crimson wax seal with a gold-pressed rim. Pass an icon or initial as children.
export function WaxSeal({ children, size = 56, className = '' }: { children?: ReactNode; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-grid shrink-0 place-items-center rounded-full text-[#f6dcb0] ${className}`}
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 32% 28%, #cf5a52 0%, #a93b37 45%, #6f1f1d 100%)',
        boxShadow: 'inset 0 2px 3px rgb(255 255 255 / 0.25), inset 0 -3px 6px rgb(0 0 0 / 0.4), 0 6px 14px -4px rgb(0 0 0 / 0.6)',
      }}
    >
      <span className="absolute inset-[5px] rounded-full border border-[#f6dcb0]/40" />
      {children}
    </span>
  );
}
