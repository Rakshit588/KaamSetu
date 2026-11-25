import { ArrowRight, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { Ornament } from '../magic/Ornament';

export function Cta() {
  return (
    <section className="pb-20 pt-4">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-xl3 border border-line/50 bg-[#0b1019] px-6 py-14 text-center text-[#E9DCC0] shadow-lift sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-[#C6A15B]/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-3 rounded-[0.8rem] border border-[#C6A15B]/30" />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-wide sm:text-5xl">
            Your Next Project Awaits Its Perfect Wizard.
          </h2>
          <Ornament className="relative mt-5" />
          <p className="relative mx-auto mt-5 max-w-xl font-serif text-xl text-[#E9DCC0]/80 sm:text-2xl">
            Hire a worker in a few taps, or sign up as a worker and start receiving nearby jobs.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login?role=customer" className="btn btn-primary">
              Discover Skilled Workers <ArrowRight size={18} />
            </Link>
            <Link href="/login?role=worker" className="btn border border-[#E9DCC0]/40 text-[#E9DCC0] hover:bg-[#E9DCC0]/10">
              Join the Marketplace
            </Link>
          </div>
          <p className="relative mt-8 font-serif text-xl italic text-[#C6A15B]">From Labour Chowks to Smart Hiring.</p>
          <p className="relative mt-3 inline-flex items-center gap-2 text-sm text-[#E9DCC0]/60">
            <Smartphone size={16} /> Android app coming soon
          </p>
        </div>
      </div>
    </section>
  );
}
