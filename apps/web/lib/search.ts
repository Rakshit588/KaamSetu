import type { Place } from './location';
import type { TradeKey } from './trades';

export type MatchReason = { key: string; label: string; contribution: number };

// Shape of one item in GET /workers/search (services/matching.ts). Note: no name and no coordinates.
export type SearchWorker = {
  workerId: string;
  profileId: string;
  digitalId: string;
  bio?: string;
  skills: { trade: TradeKey; experienceYears: number; hourlyRate?: number | null }[];
  isAvailableNow: boolean;
  isPremium: boolean;
  trustScore: number;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  verificationStatus: string;
  distanceKm: number;
  matchScore: number;
  matchReasons: MatchReason[];
  price: {
    workerPay: number;
    urgencyMultiplier: number;
    urgencySurcharge: number;
    platformFee: number;
    total: number;
    min: number;
    max: number;
  };
};

export type SearchResponse = { workers: SearchWorker[]; algorithm: string; demo: boolean };

export type SearchFilters = {
  verifiedOnly: boolean;
  availableNow: boolean;
  /** 0 means any */
  minRating: number;
  radiusKm: number;
  /** 0 means any */
  maxRate: number;
};

export const DEFAULT_FILTERS: SearchFilters = {
  verifiedOnly: false,
  availableNow: false,
  minRating: 0,
  radiusKm: 10,
  maxRate: 0,
};

export type SortKey = 'match' | 'nearest' | 'rating' | 'price';

export function sortWorkers(list: SearchWorker[], sort: SortKey): SearchWorker[] {
  const copy = [...list];
  switch (sort) {
    case 'nearest':
      return copy.sort((a, b) => a.distanceKm - b.distanceKm);
    case 'rating':
      return copy.sort((a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount);
    case 'price':
      return copy.sort((a, b) => a.price.total - b.price.total);
    default:
      return copy.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export function buildSearchQuery(trade: TradeKey, place: Place, f: SearchFilters, hours: number): string {
  const q = new URLSearchParams({
    trade,
    lng: String(place.lng),
    lat: String(place.lat),
    radiusKm: String(f.radiusKm),
    estimatedDurationHrs: String(hours),
  });
  if (f.minRating > 0) q.set('minRating', String(f.minRating));
  if (f.verifiedOnly) q.set('verifiedOnly', 'true');
  if (f.availableNow) q.set('availableNow', 'true');
  if (f.maxRate > 0) q.set('maxHourlyRate', String(f.maxRate));
  return q.toString();
}
