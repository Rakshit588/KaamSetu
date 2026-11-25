'use client';

import { BadgeCheck, Clock, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { fileToDataUrl } from '@/lib/image';
import { useT, type TKey } from '@/lib/i18n';
import type { WorkerProfileMe } from '@/lib/worker';
import { DemoBadge } from '../ui/DemoBadge';

const ID_TYPES = ['aadhaar', 'voter_id', 'dl'] as const;

type Props = { profile: WorkerProfileMe; onUpdated: (p: WorkerProfileMe) => void };

export function VerificationForm({ profile, onUpdated }: Props) {
  const { t } = useT();
  const status = profile.verification?.status ?? 'none';
  const [idType, setIdType] = useState<(typeof ID_TYPES)[number]>('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [doc, setDoc] = useState('');
  const [selfie, setSelfie] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  async function pick(file: File | undefined, set: (v: string) => void) {
    if (!file) return;
    setError('');
    try {
      set(await fileToDataUrl(file));
    } catch {
      setError(t('wid.imgFail'));
    }
  }

  async function submit() {
    setError('');
    if (idNumber.trim().length < 4 || !doc || !selfie) {
      setError(t('wid.needAll'));
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ profile: WorkerProfileMe; message?: string }>('/workers/me/verification', {
        body: { idType, idNumber: idNumber.trim(), idDocUrl: doc, selfieUrl: selfie },
      });
      onUpdated({ ...profile, ...res.profile });
      setNote(res.message ?? '');
      setIdNumber('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const badge =
    status === 'verified'
      ? { icon: BadgeCheck, cls: 'bg-mint/15 text-mint' }
      : status === 'pending'
        ? { icon: Clock, cls: 'bg-saffron/15 text-flame' }
        : status === 'rejected'
          ? { icon: XCircle, cls: 'bg-coral/15 text-coral' }
          : { icon: XCircle, cls: 'bg-line/10 text-muted' };
  const BadgeIcon = badge.icon;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">{t('wid.verifyTitle')}</h2>
        <DemoBadge />
      </div>
      <p className="mt-1 text-sm text-muted">{t('wid.verifyText')}</p>

      <p className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${badge.cls}`}>
        <BadgeIcon size={16} /> {t(`wid.status.${status}` as TKey)}
      </p>
      {status === 'rejected' && profile.verification?.rejectionReason && (
        <p className="mt-2 text-sm text-coral">{t('wid.reason', { reason: profile.verification.rejectionReason })}</p>
      )}
      {status === 'pending' && <p className="mt-3 text-sm text-muted">{t('wid.pendingText')}</p>}
      {note && <p className="mt-3 text-sm font-medium text-muted">{note}</p>}

      {(status === 'none' || status === 'rejected') && (
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <fieldset>
            <legend className="text-sm font-semibold">{t('wid.idType')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {ID_TYPES.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={idType === k}
                  onClick={() => setIdType(k)}
                  className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold ${
                    idType === k ? 'border-saffron bg-saffron/15' : 'border-line/20 bg-surface'
                  }`}
                >
                  {t(`wid.${k}` as TKey)}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="idnum" className="text-sm font-semibold">
              {t('wid.idNumber')}
            </label>
            <input
              id="idnum"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              autoComplete="off"
              className="mt-2 h-12 w-full rounded-xl2 border border-line/20 bg-surface px-4 outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/20"
            />
            <p className="mt-1 text-xs text-muted">{t('wid.idNote')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { id: 'doc', label: t('wid.docPhoto'), value: doc, set: setDoc, capture: undefined },
                { id: 'selfie', label: t('wid.selfie'), value: selfie, set: setSelfie, capture: 'user' as const },
              ] as const
            ).map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="text-sm font-semibold">
                  {f.label}
                </label>
                <label
                  htmlFor={f.id}
                  className="mt-2 grid h-36 cursor-pointer place-items-center overflow-hidden rounded-xl2 border-2 border-dashed border-line/25 bg-surface2 text-sm font-semibold text-muted hover:border-saffron"
                >
                  {f.value ? (
                    <img src={f.value} alt={f.label} className="h-full w-full object-cover" />
                  ) : (
                    t('wid.choosePhoto')
                  )}
                </label>
                <input
                  id={f.id}
                  type="file"
                  accept="image/*"
                  capture={f.capture}
                  className="sr-only"
                  onChange={(e) => void pick(e.target.files?.[0], f.set)}
                />
              </div>
            ))}
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-coral">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-70">
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" /> {t('wid.submitting')}
              </>
            ) : (
              t('wid.submit')
            )}
          </button>
        </form>
      )}
    </section>
  );
}
