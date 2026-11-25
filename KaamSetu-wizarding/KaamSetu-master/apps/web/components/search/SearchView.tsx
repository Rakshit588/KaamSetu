'use client';

import { List, Loader2, Map as MapIcon, SlidersHorizontal, Siren, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { useT, type TKey } from '@/lib/i18n';
import { DEFAULT_PLACE, loadPlace, type Place } from '@/lib/location';
import {
  DEFAULT_FILTERS,
  buildSearchQuery,
  sortWorkers,
  type SearchFilters,
  type SearchResponse,
  type SearchWorker,
  type SortKey,
} from '@/lib/search';
import { toLatLng } from '@/lib/geo';
import { TRADES, type TradeKey } from '@/lib/trades';
import { useSocketEvent } from '@/lib/useSocketEvent';
import { useWorkerDetails } from '@/lib/useWorkerDetails';
import { MapView } from '../map/MapView';
import type { MapPinData } from '../map/types';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { SearchFiltersPanel } from './SearchFilters';
import { WorkerCard } from './WorkerCard';

export function SearchView() {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const tradeParam = params.get('trade');
  const trade: TradeKey = TRADES.find((x) => x.key === tradeParam)?.key ?? 'plumber';

  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [hours, setHours] = useState(2);
  const [sort, setSort] = useState<SortKey>('match');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<SearchWorker[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [interpreting, setInterpreting] = useState(false);
  const [interpretMsg, setInterpretMsg] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setPlace(loadPlace());
  }, []);

  useEffect(() => {
    let stale = false;
    setLoading(true);
    setError('');
    const handle = setTimeout(async () => {
      try {
        const res = await api<SearchResponse>(`/workers/search?${buildSearchQuery(trade, place, filters, hours)}`);
        if (stale) return;
        setResults(res.workers);
      } catch (e) {
        if (!stale) setError(errorMessage(e));
      } finally {
        if (!stale) setLoading(false);
      }
    }, 200);
    return () => {
      stale = true;
      clearTimeout(handle);
    };
  }, [trade, place, filters, hours, reloadKey]);

  // Workers can switch themselves on or off while you are looking.
  useSocketEvent<{ workerId: string; isAvailableNow: boolean }>('availability:update', (p) => {
    setResults((prev) =>
      prev ? prev.map((w) => (w.workerId === p.workerId ? { ...w, isAvailableNow: p.isAvailableNow } : w)) : prev,
    );
  });

  const sorted = useMemo(() => sortWorkers(results ?? [], sort), [results, sort]);
  const detailOf = useWorkerDetails(sorted.map((w) => w.workerId));

  const pins: MapPinData[] = sorted.flatMap((w) => {
    const point = toLatLng(detailOf(w.workerId)?.profile.location);
    return point
      ? [{ id: w.workerId, kind: 'worker' as const, available: w.isAvailableNow, selected: w.workerId === selectedId, ...point }]
      : [];
  });
  const selected = sorted.find((w) => w.workerId === selectedId) ?? null;

  const activeFilters =
    Number(filters.verifiedOnly) +
    Number(filters.availableNow) +
    Number(filters.minRating > 0) +
    Number(filters.maxRate > 0) +
    Number(filters.radiusKm !== DEFAULT_FILTERS.radiusKm);

  const changeTrade = (key: TradeKey) => {
    setSelectedId(null);
    router.replace(`/customer/search?trade=${key}`);
  };

  async function interpret() {
    if (text.trim().length < 3) return;
    setInterpreting(true);
    setInterpretMsg('');
    try {
      const r = await api<{ trade: TradeKey | null; urgency: 'normal' | 'emergency' }>('/ai/interpret', {
        auth: false,
        body: { text: text.trim() },
      });
      setUrgent(r.urgency === 'emergency');
      if (r.trade) {
        changeTrade(r.trade);
        setInterpretMsg(t('search.interpretOk', { trade: t(`trade.${r.trade}` as TKey) }));
      } else {
        setInterpretMsg(t('search.interpretFail'));
      }
    } catch (e) {
      setInterpretMsg(errorMessage(e));
    } finally {
      setInterpreting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t('search.title')}</h1>
        <p className="mt-1 text-sm text-muted">
          {t('search.around')} ·{' '}
          <Link href="/customer" className="font-semibold text-flame">
            {t('search.change')}
          </Link>
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void interpret();
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Wand2 size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-flame" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder={t('search.describe')}
            aria-label={t('search.describe')}
            className="h-12 w-full rounded-full border border-line/20 bg-surface pl-11 pr-4 outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/20"
          />
        </div>
        <button type="submit" disabled={interpreting || text.trim().length < 3} className="btn btn-primary !px-5 disabled:opacity-60">
          {interpreting ? <Loader2 size={18} className="animate-spin" /> : t('search.describeBtn')}
        </button>
      </form>
      {interpretMsg && (
        <p role="status" className="text-sm font-medium text-muted">
          {interpretMsg}
        </p>
      )}
      {urgent && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl3 bg-coral/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-coral">
            <Siren size={18} /> {t('search.urgentHint')}
          </p>
          <Link href={`/customer/emergency?trade=${trade}`} className="btn btn-primary !min-h-[44px] !py-2 text-sm">
            {t('search.urgentCta')}
          </Link>
        </div>
      )}

      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap" role="tablist" aria-label={t('customer.pickTrade')}>
          {TRADES.map((tr) => {
            const Icon = tr.icon;
            const on = tr.key === trade;
            return (
              <li key={tr.key}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => changeTrade(tr.key)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                    on ? 'border-saffron bg-saffron/15' : 'border-line/20 bg-surface hover:bg-surface2'
                  }`}
                >
                  <Icon size={16} /> {t(`trade.${tr.key}` as TKey)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
          className="btn btn-ghost !min-h-[44px] !py-2 text-sm"
        >
          <SlidersHorizontal size={16} /> {t('search.filters')}
          {activeFilters > 0 && (
            <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-flame px-1 text-[11px] font-bold text-[#1b1206]">
              {activeFilters}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="sort">
            {t('search.sort')}
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-11 rounded-full border border-line/20 bg-surface px-4 text-sm font-semibold outline-none focus:border-saffron"
          >
            <option value="match">{t('search.sortMatch')}</option>
            <option value="nearest">{t('search.sortNearest')}</option>
            <option value="rating">{t('search.sortRating')}</option>
            <option value="price">{t('search.sortPrice')}</option>
          </select>
          <div className="flex rounded-full border border-line/10 bg-surface p-1" role="group">
            {(['list', 'map'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                aria-label={t(v === 'list' ? 'search.list' : 'search.map')}
                onClick={() => setView(v)}
                className={`grid h-9 w-11 place-items-center rounded-full transition ${view === v ? 'bg-brand text-bg' : 'text-muted'}`}
              >
                {v === 'list' ? <List size={16} /> : <MapIcon size={16} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showFilters && <SearchFiltersPanel value={filters} onChange={setFilters} hours={hours} onHours={setHours} />}

      {error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : results === null ? (
        <div className="space-y-3">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-muted" aria-live="polite">
            {loading ? t('common.loading') : t('search.found', { n: sorted.length })}
          </p>

          {sorted.length === 0 ? (
            <EmptyState title={t('search.noResults')} text={t('search.noResultsText')} />
          ) : view === 'map' ? (
            <div className="space-y-3">
              <MapView
                center={place}
                me={place}
                pins={pins}
                fitToPins
                onPinClick={(id) => setSelectedId(id)}
                className="h-[360px] sm:h-[460px]"
              />
              {selected ? (
                <WorkerCard
                  w={selected}
                  trade={trade}
                  hours={hours}
                  detail={detailOf(selected.workerId)}
                  selected
                />
              ) : (
                <p className="text-center text-sm text-muted">{t('search.mapHint')}</p>
              )}
            </div>
          ) : (
            <div className={`space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
              {sorted.map((w) => (
                <WorkerCard
                  key={w.workerId}
                  w={w}
                  trade={trade}
                  hours={hours}
                  detail={detailOf(w.workerId)}
                  selected={w.workerId === selectedId}
                  onSelect={() => setSelectedId(w.workerId)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
