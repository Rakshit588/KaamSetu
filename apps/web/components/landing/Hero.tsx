'use client';

import { motion, useReducedMotion, type MotionProps } from 'framer-motion';
import { ArrowRight, BadgeCheck, MapPin, Zap } from 'lucide-react';
import Link from 'next/link';
import { BridgeArch } from '../BridgeArch';
import { PreviewCard } from './PreviewCard';

export function Hero() {
  const reduce = useReducedMotion();
  const fade = (delay: number): MotionProps =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: 'easeOut' },
        };

  return (
    <section className="grain relative overflow-hidden">
      <div className="pointer-events-none absolute -left-32 -top-32 -z-10 h-96 w-96 rounded-full bg-saffron/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 -z-10 h-80 w-80 rounded-full bg-mint/15 blur-3xl" />

      <div className="container-x grid items-center gap-14 pb-10 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div>
          <motion.span className="eyebrow" {...fade(0)}>
            <BadgeCheck size={14} className="text-mint" /> Hyperlocal · Verified · Middleman-free
          </motion.span>

          <motion.h1
            className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl"
            {...fade(0.08)}
          >
            From labour chowks to{' '}
            <span className="bg-gradient-to-r from-saffron to-flame bg-clip-text text-transparent">smart hiring.</span>
          </motion.h1>

          <motion.p className="mt-5 max-w-xl text-lg leading-relaxed text-muted" {...fade(0.16)}>
            KaamSetu connects daily wage workers directly with homeowners, contractors and small businesses. Search
            nearby, compare ratings and prices, and book in a tap. No middlemen, no guesswork.
          </motion.p>

          <motion.div className="mt-8 flex flex-col gap-3 sm:flex-row" {...fade(0.24)}>
            <Link href="/login?role=customer" className="btn btn-primary">
              Hire a worker <ArrowRight size={18} />
            </Link>
            <Link href="/login?role=worker" className="btn btn-ghost">
              Find work
            </Link>
          </motion.div>

          <motion.ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-muted" {...fade(0.32)}>
            <li className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-saffron" /> Workers within minutes of you
            </li>
            <li className="inline-flex items-center gap-2">
              <BadgeCheck size={16} className="text-mint" /> Verified profiles, two-way ratings
            </li>
            <li className="inline-flex items-center gap-2">
              <Zap size={16} className="text-flame" /> Emergency booking
            </li>
          </motion.ul>
        </div>

        <motion.div {...fade(0.2)}>
          <PreviewCard />
        </motion.div>
      </div>

      <div className="container-x pb-6">
        <BridgeArch className="mx-auto w-full max-w-3xl text-brand" />
      </div>
    </section>
  );
}
