import { Star } from 'lucide-react';

type Props = {
  value: number;
  /** Pass onChange to make it an input (tap a star). Without it, it is display only. */
  onChange?: (value: number) => void;
  size?: number;
};

export function StarRating({ value, onChange, size = 18 }: Props) {
  const stars = [1, 2, 3, 4, 5];
  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5`}>
        {stars.map((n) => (
          <Star key={n} size={size} className={n <= Math.round(value) ? 'fill-saffron text-saffron' : 'text-line/30'} />
        ))}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-saffron/10"
        >
          <Star size={size + 8} className={n <= value ? 'fill-saffron text-saffron' : 'text-line/30'} />
        </button>
      ))}
    </span>
  );
}
