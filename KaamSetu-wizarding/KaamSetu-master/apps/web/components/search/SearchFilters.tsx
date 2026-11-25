'use client';

import { useT } from '@/lib/i18n';
import type { SearchFilters } from '@/lib/search';

function Chips<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; text: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold transition ${
              value === o.value ? 'border-saffron bg-saffron/15' : 'border-line/20 bg-surface hover:bg-surface2'
            }`}
          >
            {o.text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function SearchFiltersPanel({
  value,
  onChange,
  hours,
  onHours,
}: {
  value: SearchFilters;
  onChange: (f: SearchFilters) => void;
  hours: number;
  onHours: (h: number) => void;
}) {
  const { t } = useT();
  const set = (patch: Partial<SearchFilters>) => onChange({ ...value, ...patch });
  const any = t('search.any');

  return (
    <div className="card grid gap-5 p-5 sm:grid-cols-2">
      <div className="space-y-3 sm:col-span-2">
        {(
          [
            ['verifiedOnly', 'search.verifiedOnly'],
            ['availableNow', 'search.availableOnly'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex min-h-[44px] items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={value[key]}
              onChange={(e) => set({ [key]: e.target.checked } as Partial<SearchFilters>)}
              className="h-5 w-5 accent-[rgb(249_115_22)]"
            />
            {t(label)}
          </label>
        ))}
      </div>

      <Chips
        label={t('search.minRating')}
        value={value.minRating}
        options={[
          { value: 0, text: any },
          { value: 3.5, text: '3.5+' },
          { value: 4, text: '4+' },
          { value: 4.5, text: '4.5+' },
        ]}
        onChange={(v) => set({ minRating: v })}
      />
      <Chips
        label={t('search.radius')}
        value={value.radiusKm}
        options={[2, 5, 10, 20].map((n) => ({ value: n, text: `${n} km` }))}
        onChange={(v) => set({ radiusKm: v })}
      />
      <Chips
        label={t('search.maxRate')}
        value={value.maxRate}
        options={[
          { value: 0, text: any },
          { value: 100, text: '₹100' },
          { value: 150, text: '₹150' },
          { value: 200, text: '₹200' },
        ]}
        onChange={(v) => set({ maxRate: v })}
      />
      <Chips
        label={t('search.duration')}
        value={hours}
        options={[1, 2, 4, 8].map((n) => ({ value: n, text: t('book.hours', { n }) }))}
        onChange={onHours}
      />
    </div>
  );
}
