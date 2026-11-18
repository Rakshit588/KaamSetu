'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
};

// Six boxes: type, paste, backspace and arrow keys all behave like a normal OTP field.
export function OtpInput({ value, onChange, onComplete, disabled, invalid }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) => refs.current[Math.max(0, Math.min(5, i))]?.focus();

  const commit = (next: string, focusAt: number) => {
    const clean = next.replace(/\D/g, '').slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete(clean);
    else focus(focusAt);
  };

  const onType = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    const arr = value.split('');
    arr[i] = digit;
    commit(arr.join(''), i + 1);
  };

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = value.split('');
      if (arr[i]) {
        arr.splice(i, 1);
        onChange(arr.join(''));
        focus(i);
      } else if (i > 0) {
        arr.splice(i - 1, 1);
        onChange(arr.join(''));
        focus(i - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      focus(i - 1);
    } else if (e.key === 'ArrowRight') {
      focus(i + 1);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    commit(e.clipboardData.getData('text'), 5);
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-3" role="group" aria-label="One-time password">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ''}
          onChange={(e) => onType(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={i === 0}
          aria-label={`Digit ${i + 1} of 6`}
          aria-invalid={invalid || undefined}
          className={`h-14 w-full min-w-0 rounded-xl2 border bg-surface text-center text-xl font-semibold outline-none transition focus:border-saffron focus:ring-4 focus:ring-saffron/20 disabled:opacity-60 ${
            invalid ? 'border-coral' : 'border-line/20'
          }`}
        />
      ))}
    </div>
  );
}
