'use client';

import { useState } from 'react';
import { ApiError, api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { useT, type TKey } from '@/lib/i18n';
import { StarRating } from '../ui/StarRating';

const DEFAULT_TAGS = ['punctual', 'skilled', 'polite'];

export function ReviewForm({
  bookingId,
  title,
  tags: tagOptions = DEFAULT_TAGS,
}: {
  bookingId: string;
  /** Heading override, for example when a worker rates a customer. */
  title?: string;
  tags?: string[];
}) {
  const { t } = useT();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<'sent' | 'already' | null>(null);

  async function submit() {
    if (rating === 0) {
      setError(t('review.pickStars'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/reviews', {
        body: { bookingId, rating, tags, comment: comment.trim() || undefined },
      });
      setDone('sent');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setDone('already');
      else setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card p-5 text-center font-semibold">
        {done === 'sent' ? t('review.thanks') : t('review.already')}
      </div>
    );
  }

  return (
    <section className="card p-5" aria-label={title ?? t('review.title')}>
      <h2 className="font-display text-xl font-semibold">{title ?? t('review.title')}</h2>
      <div className="mt-2">
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {tagOptions.map((tag) => {
          const on = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              onClick={() => setTags((cur) => (on ? cur.filter((x) => x !== tag) : [...cur, tag]))}
              className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold transition ${
                on ? 'border-saffron bg-saffron/15' : 'border-line/20 bg-surface hover:bg-surface2'
              }`}
            >
              {t(`tag.${tag}` as TKey)}
            </button>
          );
        })}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder={t('review.comment')}
        aria-label={t('review.comment')}
        className="mt-3 w-full rounded-xl2 border border-line/20 bg-surface p-3 outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/20"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-coral">
          {error}
        </p>
      )}
      <button type="button" onClick={() => void submit()} disabled={busy} className="btn btn-primary mt-4 w-full disabled:opacity-70">
        {t('review.submit')}
      </button>
    </section>
  );
}
