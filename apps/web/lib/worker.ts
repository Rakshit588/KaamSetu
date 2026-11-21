import type { TradeKey } from './trades';

// GET /workers/me returns { profile } with these fields (WorkerProfile model).
export type WorkerProfileMe = {
  userId: string;
  skills: { trade: TradeKey; experienceYears: number; hourlyRate?: number | null; dailyRate?: number | null }[];
  bio?: string;
  location?: { coordinates?: number[] };
  serviceRadiusKm?: number;
  isAvailableNow: boolean;
  digitalId?: string;
  trustScore?: number;
  ratingAvg?: number;
  ratingCount?: number;
  jobsCompleted?: number;
  jobsCancelled?: number;
  completionRate?: number;
  responseRate?: number;
  onTimeRate?: number;
  earningsTotal?: number;
  isPremium?: boolean;
  verification?: { status?: string; phoneVerified?: boolean; rejectionReason?: string };
};

// GET /wallet/me
export type WalletMe = {
  demo: boolean;
  balance: number;
  earningsTotal: number;
  jobsCompleted: number;
  trustScore: number | null;
  pendingPayout: number;
  earnings: { today: number; week: number; month: number };
  series: { date: string; amount: number }[];
  transactions: { id: string; bookingId: string | null; type?: string; amount: number; note?: string; at: string }[];
};
