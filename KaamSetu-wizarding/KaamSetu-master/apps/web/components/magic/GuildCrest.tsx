import type { LucideIcon } from 'lucide-react';

// Hexagonal gold-rimmed crest that holds a trade icon.
export function GuildCrest({ icon: Icon, size = 64 }: { icon: LucideIcon; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative grid shrink-0 place-items-center text-brand"
      style={{ width: size, height: size }}
    >
      <span className="hex absolute inset-0 bg-gradient-to-b from-[rgb(var(--gold-hi))] via-[rgb(var(--gold))] to-[rgb(var(--gold-lo))]" />
      <span className="hex absolute inset-[3px] bg-surface" />
      <span className="hex absolute inset-[3px] bg-gradient-to-b from-line/10 to-transparent" />
      <Icon className="relative" size={Math.round(size * 0.42)} strokeWidth={1.7} />
    </span>
  );
}
