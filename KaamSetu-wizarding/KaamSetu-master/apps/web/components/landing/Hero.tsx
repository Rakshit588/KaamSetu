'use client';

import { motion, useReducedMotion, type MotionProps } from 'framer-motion';
import { ArrowRight, BadgeCheck, MapPin, Siren } from 'lucide-react';
import Link from 'next/link';
import { AlleyScene } from '../magic/AlleyScene';

export function Hero() {
  const reduce = useReducedMotion();
  const rise = (delay: number): MotionProps =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: 'easeOut' },
        };

  return (
    <section className="relative isolate overflow-hidden border-b border-line/30">
      {/* The street is the hero. A gradient keeps the copy readable over it. */}
      <AlleyScene className="absolute inset-0 -z-10 h-full w-full" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/80 to-transparent sm:via-bg/55" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-bg to-transparent" />

      <div className="container-x flex min-h-[560px] flex-col justify-center py-16 sm:min-h-[620px] sm:py-24">
        <motion.p className="font-display text-sm tracking-[0.35em] text-brand sm:text-base" {...rise(0)}>
          KAAMSETU
        </motion.p>

        <motion.h1
          className="mt-4 max-w-2xl text-[2.5rem] font-semibold leading-[1.1] tracking-wide sm:text-6xl"
          {...rise(0.1)}
        >
          Every Skill Has A <span className="gold-text">Little Magic.</span>
        </motion.h1>

        <motion.p className="mt-5 max-w-xl font-serif text-xl leading-relaxed text-ink/90 sm:text-2xl" {...rise(0.2)}>
          Discover skilled professionals, connect directly and bring your everyday projects to life.
        </motion.p>

        <motion.div className="mt-8 flex flex-col gap-3 sm:flex-row" {...rise(0.3)}>
          <Link href="/login?role=customer" className="btn btn-primary">
            Discover Skilled Workers <ArrowRight size={18} />
          </Link>
          <Link href="/login?role=worker" className="btn btn-ghost">
            Join the Marketplace
          </Link>
        </motion.div>

        <motion.ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-ink/80" {...rise(0.4)}>
          <li className="inline-flex items-center gap-2">
            <MapPin size={16} className="text-brand" /> Workers near you
          </li>
          <li className="inline-flex items-center gap-2">
            <BadgeCheck size={16} className="text-mint" /> Verified profiles, two-way ratings
          </li>
          <li className="inline-flex items-center gap-2">
            <Siren size={16} className="text-coral" /> Emergency booking
          </li>
        </motion.ul>

        <motion.p className="mt-8 font-serif text-lg italic text-muted" {...rise(0.5)}>
          Where Every Skill Finds Its Magic.
        </motion.p>
      </div>
    </section>
  );
}
