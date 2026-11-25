import { MATCH_WEIGHTS } from './constants.js';
import { TRADE_KEYS, type MatchCandidate, type MatchReason, type MatchResult, type TradeKey } from './types.js';

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

export interface MatchingService {
  rank(candidates: MatchCandidate[]): MatchResult[];
}

export function distanceScore(distanceKm: number, searchRadiusKm: number): number {
  if (searchRadiusKm <= 0) return 0;
  return clamp(100 * (1 - distanceKm / searchRadiusKm));
}

export function scoreCandidate(c: MatchCandidate): MatchResult {
  const parts = {
    skill: clamp(c.skillMatch),
    distance: distanceScore(c.distanceKm, c.searchRadiusKm),
    trust: clamp(c.trustScore),
    availability: c.isAvailableNow ? 100 : 35,
    priceFit: clamp(c.priceFit),
    pastSuccess: clamp(c.pastSuccessWithCustomer),
    response: clamp(c.responseRate),
  };

  const weighted = {
    skill: parts.skill * MATCH_WEIGHTS.skill,
    distance: parts.distance * MATCH_WEIGHTS.distance,
    trust: parts.trust * MATCH_WEIGHTS.trust,
    availability: parts.availability * MATCH_WEIGHTS.availability,
    priceFit: parts.priceFit * MATCH_WEIGHTS.priceFit,
    pastSuccess: parts.pastSuccess * MATCH_WEIGHTS.pastSuccess,
    response: parts.response * MATCH_WEIGHTS.response,
  };

  const score = Math.round(Object.values(weighted).reduce((a, b) => a + b, 0) / 100);

  const labels: Record<keyof typeof parts, string> = {
    skill: 'Strong skill match for this trade',
    distance: 'Close to the job location',
    trust: 'High trust score',
    availability: 'Available now',
    priceFit: 'Rate fits the expected price band',
    pastSuccess: 'Successful jobs with you before',
    response: 'Responds quickly to requests',
  };

  const reasons: MatchReason[] = (Object.keys(weighted) as (keyof typeof weighted)[])
    .map((key) => ({
      key,
      label: labels[key],
      contribution: Math.round(weighted[key]) / 100,
    }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);

  return { workerId: c.workerId, score, reasons };
}

export class WeightedMatchingService implements MatchingService {
  rank(candidates: MatchCandidate[]): MatchResult[] {
    return candidates.map(scoreCandidate).sort((a, b) => b.score - a.score);
  }
}

const TRADE_KEYWORDS: Record<TradeKey, string[]> = {
  mason: ['mason', 'brick', 'cement', 'wall', 'राज', 'ईंट', 'दीवार'],
  electrician: ['electric', 'wiring', 'fan', 'switch', 'बिजली', 'वायरिंग', 'फैन'],
  plumber: ['plumb', 'tap', 'leak', 'pipe', 'drain', 'नल', 'पाइप', 'लीक'],
  carpenter: ['carpenter', 'wood', 'door', 'furniture', 'बढ़ई', 'लकड़ी', 'दरवाजा'],
  painter: ['paint', 'wall paint', 'पेंट', 'रंग'],
  construction_labour: ['labour', 'construction', 'loading', 'मजदूर', 'निर्माण'],
  cleaner: ['clean', 'maid', 'sweep', 'सफाई', 'झाड़ू'],
  repair_technician: ['repair', 'ac', 'fridge', 'washing', 'मरम्मत', 'एसी'],
};

export function mapTextToTrade(text: string): { trade: TradeKey | null; urgency: 'normal' | 'emergency' } {
  const t = text.toLowerCase();
  const urgency: 'normal' | 'emergency' =
    /emergency|urgent|now|abhi|turant|फटाफट|अभी|जरूरी/.test(t) ? 'emergency' : 'normal';
  let best: TradeKey | null = null;
  let bestHits = 0;
  for (const trade of TRADE_KEYS) {
    const hits = TRADE_KEYWORDS[trade].filter((k) => t.includes(k.toLowerCase())).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = trade;
    }
  }
  return { trade: best, urgency };
}