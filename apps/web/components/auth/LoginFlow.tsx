'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BadgeCheck, HardHat, Loader2, MapPin, UserRound, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { User } from '@/lib/types';
import { BridgeArch } from '../BridgeArch';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';
import { OtpInput } from './OtpInput';

type Step = 'phone' | 'otp' | 'role';
type PickRole = 'customer' | 'worker';

const messageOf = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');

const copy = {
  customer: { title: 'Hire a worker', sub: 'Sign in to find verified workers near you.' },
  worker: { title: 'Join as a worker', sub: 'Sign in to get nearby jobs and build your reputation.' },
  none: { title: 'Welcome to KaamSetu', sub: 'Sign in with your mobile number. No password needed.' },
};

export function LoginFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, status, signIn, setSession } = useAuth();

  const roleParam = params.get('role');
  const intent: PickRole | null = roleParam === 'worker' || roleParam === 'customer' ? roleParam : null;
  const nextParam = params.get('next');
  const next = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard';

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [role, setRole] = useState<PickRole | null>(intent);
  const [name, setName] = useState('');

  // Single source of truth for navigation: once signed in, either pick a role or leave.
  useEffect(() => {
    if (status !== 'authed' || !user) return;
    if (user.role) router.replace(next);
    else setStep('role');
  }, [status, user, next, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function sendOtp() {
    setError('');
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter your 10-digit mobile number.');
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ ok: boolean; demo: boolean }>('/auth/otp/request', {
        body: { phone },
        auth: false,
      });
      setDemo(res.demo);
      setOtp('');
      setStep('otp');
      setCooldown(30);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function verify(code: string) {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const res = await api<{ accessToken: string; refreshToken: string; user: User; needsRole: boolean }>(
        '/auth/otp/verify',
        { body: { phone, otp: code }, auth: false },
      );
      signIn(res.accessToken, res.refreshToken, res.user);
    } catch (e) {
      setError(messageOf(e));
      setOtp('');
    } finally {
      setBusy(false);
    }
  }

  async function chooseRole() {
    setError('');
    if (!role) {
      setError('Choose how you want to use KaamSetu.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ user: User; accessToken: string }>('/auth/role', {
        body: { role, name: name.trim() },
      });
      setSession(res.user, res.accessToken);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  const heading = copy[intent ?? 'none'];

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      {/* Brand panel (desktop) */}
      <aside className="grain relative hidden overflow-hidden bg-[#0B1F4B] p-12 text-[#FFF8E7] lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-saffron/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-mint/15 blur-3xl" />
        <Link href="/" aria-label="KaamSetu home">
          <Logo tone="light" />
        </Link>
        <div>
          <h2 className="font-display text-5xl font-semibold leading-tight tracking-tight">
            The bridge between <span className="text-saffron">work</span> and the people who need it.
          </h2>
          <ul className="mt-8 space-y-4 text-[#FFF8E7]/80">
            <li className="flex items-center gap-3">
              <MapPin size={20} className="text-saffron" /> Nearby workers, ranked by how well they fit
            </li>
            <li className="flex items-center gap-3">
              <BadgeCheck size={20} className="text-mint" /> Verified profiles and two-way ratings
            </li>
            <li className="flex items-center gap-3">
              <Zap size={20} className="text-flame" /> Emergency booking when it cannot wait
            </li>
          </ul>
        </div>
        <BridgeArch className="w-full text-[#FFF8E7]" />
      </aside>

      {/* Form */}
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="lg:hidden" aria-label="KaamSetu home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              {step === 'phone' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendOtp();
                  }}
                >
                  <h1 className="font-display text-4xl font-semibold tracking-tight">{heading.title}</h1>
                  <p className="mt-3 text-muted">{heading.sub}</p>

                  <label htmlFor="phone" className="mt-8 block text-sm font-semibold">
                    Mobile number
                  </label>
                  <div className="mt-2 flex items-stretch overflow-hidden rounded-xl2 border border-line/20 bg-surface focus-within:border-saffron focus-within:ring-4 focus-within:ring-saffron/20">
                    <span className="grid place-items-center border-r border-line/10 px-4 text-base font-semibold text-muted">
                      +91
                    </span>
                    <input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      autoFocus
                      placeholder="98765 43210"
                      className="h-14 w-full bg-transparent px-4 text-lg font-medium tracking-wide outline-none placeholder:text-muted/60"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="mt-3 text-sm font-medium text-coral">
                      {error}
                    </p>
                  )}

                  <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full disabled:opacity-70">
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <>Send OTP <ArrowRight size={18} /></>}
                  </button>
                  <p className="mt-4 text-center text-xs text-muted">
                    New here? We will create your account after you verify.
                  </p>
                </form>
              )}

              {step === 'otp' && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError('');
                    }}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
                  >
                    <ArrowLeft size={16} /> Change number
                  </button>
                  <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Enter the OTP</h1>
                  <p className="mt-3 text-muted">
                    We sent a 6-digit code to <span className="font-semibold text-ink">+91 {phone}</span>.
                  </p>

                  <div className="mt-8">
                    <OtpInput
                      value={otp}
                      onChange={setOtp}
                      onComplete={(code) => void verify(code)}
                      disabled={busy}
                      invalid={Boolean(error)}
                    />
                  </div>

                  {error && (
                    <p role="alert" className="mt-3 text-sm font-medium text-coral">
                      {error}
                    </p>
                  )}

                  {demo && (
                    <button
                      type="button"
                      onClick={() => {
                        setOtp('123456');
                        void verify('123456');
                      }}
                      className="mt-5 w-full rounded-xl2 border border-dashed border-saffron/60 bg-saffron/10 px-4 py-3 text-left text-sm"
                    >
                      <span className="font-semibold">Demo mode:</span> the OTP is{' '}
                      <span className="font-mono font-bold">123456</span>. Tap to fill it in.
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void sendOtp()}
                    disabled={cooldown > 0 || busy}
                    className="mt-6 text-sm font-semibold text-flame disabled:text-muted"
                  >
                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                  </button>
                  {busy && (
                    <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                      <Loader2 size={16} className="animate-spin" /> Verifying...
                    </p>
                  )}
                </div>
              )}

              {step === 'role' && (
                <div>
                  <h1 className="font-display text-4xl font-semibold tracking-tight">One last step</h1>
                  <p className="mt-3 text-muted">Tell us how you will use KaamSetu. You can only pick this once.</p>

                  <div className="mt-8 grid gap-3" role="radiogroup" aria-label="I want to">
                    {(
                      [
                        { key: 'customer', title: 'I need a worker', text: 'Hire plumbers, electricians, masons and more.', icon: UserRound },
                        { key: 'worker', title: 'I am a worker', text: 'Get nearby jobs and build a trusted profile.', icon: HardHat },
                      ] as const
                    ).map((o) => {
                      const Icon = o.icon;
                      const selected = role === o.key;
                      return (
                        <button
                          key={o.key}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setRole(o.key)}
                          className={`flex items-center gap-4 rounded-xl2 border p-4 text-left transition ${
                            selected ? 'border-saffron bg-saffron/10 shadow-soft' : 'border-line/15 bg-surface hover:border-line/30'
                          }`}
                        >
                          <span
                            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl2 ${
                              selected ? 'bg-gradient-to-br from-saffron to-flame text-[#2a1600]' : 'bg-line/10 text-muted'
                            }`}
                          >
                            <Icon size={24} />
                          </span>
                          <span>
                            <span className="block font-semibold">{o.title}</span>
                            <span className="text-sm text-muted">{o.text}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <label htmlFor="name" className="mt-6 block text-sm font-semibold">
                    Your name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    maxLength={80}
                    placeholder="e.g. Ramesh Kumar"
                    className="mt-2 h-14 w-full rounded-xl2 border border-line/20 bg-surface px-4 text-lg font-medium outline-none placeholder:text-muted/60 focus:border-saffron focus:ring-4 focus:ring-saffron/20"
                  />

                  {error && (
                    <p role="alert" className="mt-3 text-sm font-medium text-coral">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => void chooseRole()}
                    disabled={busy}
                    className="btn btn-primary mt-6 w-full disabled:opacity-70"
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <>Continue <ArrowRight size={18} /></>}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
