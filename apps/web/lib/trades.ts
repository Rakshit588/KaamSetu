import { Brush, Droplets, HardHat, Hammer, Layers, Settings, Sparkles, Zap, type LucideIcon } from 'lucide-react';

export type TradeKey =
  | 'mason'
  | 'electrician'
  | 'plumber'
  | 'carpenter'
  | 'painter'
  | 'construction_labour'
  | 'cleaner'
  | 'repair_technician';

export const TRADES: { key: TradeKey; icon: LucideIcon; tint: string }[] = [
  { key: 'mason', icon: Layers, tint: 'text-flame bg-flame/15' },
  { key: 'electrician', icon: Zap, tint: 'text-saffron bg-saffron/15' },
  { key: 'plumber', icon: Droplets, tint: 'text-mint bg-mint/15' },
  { key: 'carpenter', icon: Hammer, tint: 'text-flame bg-flame/15' },
  { key: 'painter', icon: Brush, tint: 'text-coral bg-coral/15' },
  { key: 'construction_labour', icon: HardHat, tint: 'text-saffron bg-saffron/15' },
  { key: 'cleaner', icon: Sparkles, tint: 'text-mint bg-mint/15' },
  { key: 'repair_technician', icon: Settings, tint: 'text-brand bg-brand/10' },
];
