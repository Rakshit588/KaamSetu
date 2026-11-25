import { Brush, Droplets, HardHat, Hammer, Layers, Settings, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { GuildCrest } from '../magic/GuildCrest';

// Real trade name stays first and largest; the guild name is the themed layer.
const trades: { en: string; hi: string; guild: string; icon: LucideIcon }[] = [
  { en: 'Mason', hi: 'राजमिस्त्री', guild: 'Masonry Guild', icon: Layers },
  { en: 'Electrician', hi: 'इलेक्ट्रीशियन', guild: 'Electrical Guild', icon: Zap },
  { en: 'Plumber', hi: 'प्लंबर', guild: 'Plumbing Guild', icon: Droplets },
  { en: 'Carpenter', hi: 'बढ़ई', guild: 'Carpentry Guild', icon: Hammer },
  { en: 'Painter', hi: 'पेंटर', guild: 'Painting Guild', icon: Brush },
  { en: 'Construction labour', hi: 'मज़दूर', guild: 'Construction Guild', icon: HardHat },
  { en: 'Cleaner', hi: 'सफ़ाई कर्मी', guild: 'Cleaning Guild', icon: Sparkles },
  { en: 'Repair technician', hi: 'मरम्मत तकनीशियन', guild: 'Repair Guild', icon: Settings },
];

export function Trades() {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {trades.map((t) => (
        <li key={t.en}>
          <Link
            href="/login?role=customer"
            className="card group flex h-full flex-col items-center gap-4 p-5 text-center transition hover:-translate-y-1 hover:shadow-lift"
          >
            <GuildCrest icon={t.icon} size={68} />
            <span>
              <span className="block font-display text-lg font-semibold leading-tight">{t.en}</span>
              <span className="mt-1 block text-sm text-muted">{t.hi}</span>
              <span className="mt-1 block font-serif text-base italic text-brand">{t.guild}</span>
            </span>
            <span className="mt-auto text-sm font-semibold text-brand opacity-80 transition group-hover:opacity-100">
              Find nearby →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
