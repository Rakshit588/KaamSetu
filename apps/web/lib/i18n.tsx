'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en as enBase } from '../locales/en';
import { enSearch } from '../locales/en.search';
import { enWorker } from '../locales/en.worker';
import { hi as hiBase } from '../locales/hi';
import { hiSearch } from '../locales/hi.search';
import { hiWorker } from '../locales/hi.worker';

// Dictionaries are split by area and merged here. English is the source of truth.
const en = { ...enBase, ...enSearch, ...enWorker } as const;
const hi = { ...hiBase, ...hiSearch, ...hiWorker };

export type Lang = 'en' | 'hi';
export type TKey = keyof typeof en;
type Vars = Record<string, string | number>;

const dictionaries: Record<Lang, Partial<Record<TKey, string>>> = { en, hi };
const STORAGE_KEY = 'ks-lang';

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey, vars?: Vars) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start with English on both server and client, then switch after mount to avoid a hydration mismatch.
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'hi') setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: TKey, vars?: Vars) => {
      const raw: string = dictionaries[lang][key] ?? en[key] ?? key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used inside <LanguageProvider>');
  return ctx;
}
