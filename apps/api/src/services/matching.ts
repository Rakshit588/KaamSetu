import {
  CITY_CONFIG,
  TRADES,
  WeightedMatchingService,
  estimatePrice,
  type MatchCandidate,
  type TradeKey,
  type UrgencyLevel,
} from '@kaamsetu/shared';
import { Types } from 'mongoose';
import { Booking } from '../models/Booking.js';
import { WorkerProfile } from '../models/WorkerProfile.js';

const matchingService = new WeightedMatchingService();

export type SearchFilters = {
  trade: TradeKey;
  lng: number;
  lat: number;
  radiusKm?: number;
  minRating?: number;
  verifiedOnly?: boolean;
  availableNow?: boolean;
  maxHourlyRate?: number;
  customerId?: string;
  urgency?: UrgencyLevel;
  estimatedDurationHrs?: number;
};

export async function searchAndRankWorkers(filters: SearchFilters) {
  const radiusKm = filters.radiusKm ?? CITY_CONFIG.defaultSearchRadiusKm;
  const geoQuery: Record<string, unknown> = {
    'skills.trade': filters.trade,
  };
  if (filters.availableNow) geoQuery.isAvailableNow = true;
  if (filters.verifiedOnly) geoQuery['verification.status'] = 'verified';
  if (filters.minRating) geoQuery.ratingAvg = { $gte: filters.minRating };

  const nearby = await WorkerProfile.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [filters.lng, filters.lat] },
        distanceField: 'distanceMeters',
        maxDistance: radiusKm * 1000,
        spherical: true,
        query: geoQuery,
      },
    },
    { $limit: 50 },
  ]);

  const trade = TRADES[filters.trade];
  const pastCounts = new Map<string, number>();
  if (filters.customerId) {
    const past = await Booking.aggregate([
      {
        $match: {
          customerId: new Types.ObjectId(filters.customerId),
          status: { $in: ['completed', 'paid'] },
          workerId: { $in: nearby.map((w) => w.userId) },
        },
      },
      { $group: { _id: '$workerId', count: { $sum: 1 } } },
    ]);
    for (const row of past) pastCounts.set(String(row._id), row.count);
  }

  const candidates: MatchCandidate[] = nearby.map((w) => {
    const skill = w.skills.find((s: { trade: string }) => s.trade === filters.trade);
    const workerRate = skill?.hourlyRate ?? trade.baseRateHour;
    const priceFit = Math.max(
      0,
      100 - (Math.abs(workerRate - trade.baseRateHour) / trade.baseRateHour) * 80,
    );
    if (filters.maxHourlyRate && workerRate > filters.maxHourlyRate) {
      return null;
    }
    const past = pastCounts.get(String(w.userId)) ?? 0;
    return {
      workerId: String(w.userId),
      skillMatch: skill ? Math.min(100, 60 + skill.experienceYears * 8) : 0,
      distanceKm: (w.distanceMeters as number) / 1000,
      searchRadiusKm: radiusKm,
      trustScore: w.trustScore ?? 50,
      isAvailableNow: Boolean(w.isAvailableNow),
      priceFit,
      pastSuccessWithCustomer: Math.min(100, past * 25),
      responseRate: w.responseRate ?? 50,
    };
  }).filter(Boolean) as MatchCandidate[];

  const ranked = matchingService.rank(candidates);
  const byId = new Map(nearby.map((w) => [String(w.userId), w]));

  return ranked.map((r) => {
    const w = byId.get(r.workerId)!;
    const skill = w.skills.find((s: { trade: string }) => s.trade === filters.trade);
    const price = estimatePrice({
      baseRateHour: trade.baseRateHour,
      baseRateDay: trade.baseRateDay,
      minRate: trade.minRate,
      maxRate: trade.maxRate,
      workerHourlyRate: skill?.hourlyRate,
      estimatedDurationHrs: filters.estimatedDurationHrs ?? 2,
      urgency: filters.urgency ?? 'normal',
      isNight: false,
    });
    return {
      workerId: r.workerId,
      profileId: String(w._id),
      digitalId: w.digitalId,
      bio: w.bio,
      skills: w.skills,
      isAvailableNow: w.isAvailableNow,
      isPremium: w.isPremium,
      trustScore: w.trustScore,
      ratingAvg: w.ratingAvg,
      ratingCount: w.ratingCount,
      jobsCompleted: w.jobsCompleted,
      verificationStatus: w.verification?.status,
      distanceKm: Math.round(((w.distanceMeters as number) / 1000) * 100) / 100,
      matchScore: r.score,
      matchReasons: r.reasons,
      price,
    };
  });
}
