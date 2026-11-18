import { Brush, Droplets, HardHat, Hammer, Layers, Settings, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

const trades: { en: string; hi: string; icon: LucideIcon; tint: string }[] = [
  { en: 'Mason', hi: 'राजमिस्त्री', icon: Layers, tint: 'text-flame bg-flame/15' },
  { en: 'Electrician', hi: 'इलेक्ट्रीशियन', icon: Zap, tint: 'text-saffron bg-saffron/15' },
  { en: 'Plumber', hi: 'प्लंबर', icon: Droplets, tint: 'text-mint bg-mint/15' },
  { en: 'Carpenter', hi: 'बढ़ई', icon: Hammer, tint: 'text-flame bg-flame/15' },
  { en: 'Painter', hi: 'पेंटर', icon: Brush, tint: 'text-coral bg-coral/15' },
  { en: 'Construction labour', hi: 'मज़दूर', icon: HardHat, tint: 'text-saffron bg-saffron/15' },
  { en: 'Cleaner', hi: 'सफ़ाई कर्मी', icon: Sparkles, tint: 'text-mint bg-mint/15' },
  { en: 'Repair technician', hi: 'मरम्मत तकनीशियन', icon: Settings, tint: 'text-brand bg-brand/10' },
];

export function Trades() {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {trades.map((t) => {
        const Icon = t.icon;
        return (
          <li key={t.en}>
            <Link
              href="/login?role=customer"
              className="card group flex h-full flex-col items-start gap-4 p-5 transition hover:-translate-y-1 hover:shadow-lift"
            >
              <span className={`grid h-12 w-12 place-items-center rounded-xl2 ${t.tint}`}>
                <Icon size={24} />
              </span>
              <span>
                <span className="block font-display text-lg font-semibold leading-tight">{t.en}</span>
                <span className="mt-1 block text-sm text-muted">{t.hi}</span>
              </span>
              <span className="mt-auto text-sm font-semibold text-flame opacity-80 transition group-hover:opacity-100">
                Find nearby →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
