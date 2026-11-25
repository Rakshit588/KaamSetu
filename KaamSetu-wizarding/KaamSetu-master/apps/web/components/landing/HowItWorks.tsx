'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Bell,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  MapPin,
  ShieldCheck,
  Smartphone,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { BridgeArch } from '../BridgeArch';

type Step = { title: string; text: string; icon: LucideIcon };

const customer: Step[] = [
  { title: 'Open the app', text: 'Sign in with your phone number and an OTP. No forms to fill.', icon: Smartphone },
  { title: 'Pick a service', text: 'Plumber, electrician, mason and more. Or describe the problem in your own words.', icon: ClipboardList },
  { title: 'Set the location', text: 'Use GPS, drop a pin on the map, or type the address.', icon: MapPin },
  { title: 'See nearby workers', text: 'Workers around you, ranked by a match score that explains why they fit.', icon: Users },
  { title: 'Compare ratings and price', text: 'Trust score, reviews and a clear price range, with the platform fee shown.', icon: Star },
  { title: 'Book', text: 'Book now or schedule. For urgent jobs, use emergency booking.', icon: CalendarCheck },
  { title: 'Work gets done', text: 'Track status live, chat in the app, and confirm start and finish with OTPs.', icon: CheckCircle2 },
  { title: 'Pay securely', text: 'Pay by UPI in the app. Money is released to the worker when you confirm.', icon: CreditCard },
];

const worker: Step[] = [
  { title: 'Register', text: 'Phone number and OTP. Pick your language and you are in.', icon: UserPlus },
  { title: 'Add your skills', text: 'Choose your trades with big icons, add experience and your own rate.', icon: Wrench },
  { title: 'Get verified', text: 'Submit an ID for review and earn a verified badge and a higher trust score.', icon: ShieldCheck },
  { title: 'Receive nearby requests', text: 'Job alerts arrive with distance and price, with a countdown to respond.', icon: Bell },
  { title: 'Accept work', text: 'Tap accept. The first worker to accept gets the job, so no double bookings.', icon: Briefcase },
  { title: 'Complete the task', text: 'Start with the customer\'s OTP, finish with a completion OTP.', icon: ClipboardCheck },
  { title: 'Get paid', text: 'Your earnings dashboard shows today, this week and this month.', icon: Wallet },
  { title: 'Build your reputation', text: 'Every good job raises your rating and trust score, and your digital ID grows with you.', icon: TrendingUp },
];

export function HowItWorks() {
  const reduce = useReducedMotion();
  const [role, setRole] = useState<'customer' | 'worker'>('customer');
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const steps = role === 'customer' ? customer : worker;

  useEffect(() => {
    if (!auto || reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % 8), 2800);
    return () => clearInterval(id);
  }, [auto, reduce]);

  const pickRole = (r: 'customer' | 'worker') => {
    setRole(r);
    setActive(0);
  };
  const pickStep = (i: number) => {
    setAuto(false);
    setActive(i);
  };

  const current = steps[active];
  const Icon = current.icon;

  return (
    <div>
      <div className="mx-auto flex w-fit rounded-xl border border-line/30 bg-surface p-1 shadow-soft" role="tablist" aria-label="Choose a journey">
        {(['customer', 'worker'] as const).map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={role === r}
            onClick={() => pickRole(r)}
            className={`min-h-[44px] rounded-lg px-6 text-sm font-semibold transition ${
              role === r ? 'bg-brand text-bg' : 'text-muted hover:text-ink'
            }`}
          >
            {r === 'customer' ? 'I need a worker' : 'I am a worker'}
          </button>
        ))}
      </div>

      <ol className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {steps.map((s, i) => {
          const StepIcon = s.icon;
          const done = i <= active;
          return (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => pickStep(i)}
                aria-current={i === active ? 'step' : undefined}
                className={`flex h-full w-full flex-col items-center gap-2 rounded-xl2 border p-3 text-center transition ${
                  i === active
                    ? 'border-saffron bg-surface shadow-soft'
                    : 'border-line/10 bg-surface/50 hover:bg-surface'
                }`}
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${
                    done ? 'bg-gradient-to-br from-saffron to-flame text-[#2a1600]' : 'bg-line/10 text-muted'
                  }`}
                >
                  <StepIcon size={18} />
                </span>
                <span className="text-xs font-semibold leading-tight">
                  <span className="text-muted">{i + 1}. </span>
                  {s.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="card mx-auto mt-8 max-w-3xl overflow-hidden p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${role}-${active}`}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-4"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl2 bg-saffron/15 text-flame">
              <Icon size={24} />
            </span>
            <div>
              <p className="font-serif text-lg italic text-brand">
                {role === 'customer' ? 'The path of the seeker' : 'The path of the guild member'}, step {active + 1} of 8
              </p>
              <h3 className="mt-1 font-display text-2xl font-semibold">{current.title}</h3>
              <p className="mt-2 text-muted">{current.text}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        <BridgeArch progress={(active + 1) / 8} className="mt-6 w-full text-brand" />
      </div>
    </div>
  );
}
