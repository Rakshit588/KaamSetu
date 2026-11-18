import { ArrowRight, Smartphone } from 'lucide-react';
import Link from 'next/link';

export function Cta() {
  return (
    <section className="pb-20 pt-4">
      <div className="container-x">
        <div className="grain relative overflow-hidden rounded-[2rem] bg-[#0B1F4B] px-6 py-14 text-center text-[#FFF8E7] sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-saffron/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-mint/20 blur-3xl" />
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            Connecting work. Building Bharat.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#FFF8E7]/75">
            Try the web app now. Hire a worker in a few taps, or sign up as a worker and start receiving nearby jobs.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login?role=customer" className="btn btn-primary">
              Hire a worker <ArrowRight size={18} />
            </Link>
            <Link href="/login?role=worker" className="btn border border-[#FFF8E7]/30 text-[#FFF8E7] hover:bg-[#FFF8E7]/10">
              Join as a worker
            </Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-[#FFF8E7]/60">
            <Smartphone size={16} /> Android app coming soon
          </p>
        </div>
      </div>
    </section>
  );
}
