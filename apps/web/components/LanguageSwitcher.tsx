'use client';

import { useT } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useT();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
      aria-label={t('shell.language')}
      className="grid h-11 min-w-[44px] place-items-center rounded-full border border-line/15 bg-surface/70 px-3 text-sm font-semibold transition hover:bg-surface"
    >
      {lang === 'en' ? 'हिं' : 'EN'}
    </button>
  );
}
