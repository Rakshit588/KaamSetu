'use client';

import { Briefcase, Check, CheckCircle2, Hourglass, Truck, Wallet, type LucideIcon } from 'lucide-react';
import { STATUS_FLOW, type BookingStatus } from '@/lib/booking';
import { useT, type TKey } from '@/lib/i18n';
import { BridgeArch } from '../BridgeArch';

const ICONS: Record<string, LucideIcon> = {
  requested: Hourglass,
  accepted: Check,
  on_the_way: Truck,
  in_progress: Briefcase,
  completed: CheckCircle2,
  paid: Wallet,
};

// The booking journey drawn as the bridge being built, one span per step.
export function StatusBridge({ status }: { status: BookingStatus }) {
  const { t } = useT();
  const index = Math.max(0, STATUS_FLOW.indexOf(status));
  return (
    <div className="card p-5 sm:p-6">
      <BridgeArch progress={(index + 1) / STATUS_FLOW.length} className="w-full text-brand" />
      <ol className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {STATUS_FLOW.map((s, i) => {
          const Icon = ICONS[s];
          const done = i <= index;
          return (
            <li key={s} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={`grid h-10 w-10 place-items-center rounded-full ${
                  done ? 'bg-gradient-to-br from-saffron to-flame text-[#2a1600]' : 'bg-line/10 text-muted'
                }`}
                aria-current={i === index ? 'step' : undefined}
              >
                <Icon size={18} />
              </span>
              <span className={`text-[11px] font-semibold leading-tight ${done ? 'text-ink' : 'text-muted'}`}>
                {t(`status.${s}` as TKey)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
