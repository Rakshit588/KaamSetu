import type { TradeKey } from './trades';

export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'on_the_way'
  | 'in_progress'
  | 'completed'
  | 'paid'
  | 'cancelled'
  | 'disputed';

// The happy path, in order. Used for the bridge progress.
export const STATUS_FLOW: BookingStatus[] = ['requested', 'accepted', 'on_the_way', 'in_progress', 'completed', 'paid'];

export const ACTIVE_STATUSES: BookingStatus[] = ['requested', 'accepted', 'on_the_way', 'in_progress', 'completed'];

// Shape of publicBooking() in apps/api/src/services/booking.ts
export type Booking = {
  id: string;
  customerId: string;
  workerId: string | null;
  trade: TradeKey;
  description?: string;
  address?: string;
  location?: { coordinates?: number[] };
  scheduledFor?: string;
  isEmergency: boolean;
  estimatedDurationHrs?: number;
  priceEstimate?: { min: number; max: number; urgencyMultiplier: number };
  finalPrice?: number;
  platformFee?: number;
  workerPay?: number;
  status: BookingStatus;
  statusTimeline?: { status: string; at: string; note?: string }[];
  payment?: { provider?: string; orderId?: string; status?: string; method?: string; paidAt?: string };
  cancelReason?: string;
  urgency?: string;
  broadcastRadiusKm?: number;
  acceptDeadlineAt?: string;
  notifiedWorkerIds?: string[];
  etaMinutes?: number;
  invoiceNumber?: string;
  fallbackNotifiedAt?: string;
  createdAt?: string;
  startOtp?: string | number;
  completionOtp?: string | number;
  demoPayment?: boolean;
};

// Shape of estimatePrice() in packages/shared
export type PriceBreakdown = {
  min: number;
  max: number;
  total: number;
  workerPay: number;
  platformFee: number;
  urgencySurcharge: number;
  urgencyMultiplier: number;
};

// Shape of GET /workers/:id
export type WorkerDetail = {
  user: { id: string; name: string; avatarUrl?: string } | null;
  profile: {
    userId: string;
    skills: { trade: TradeKey; experienceYears: number; hourlyRate?: number | null; dailyRate?: number | null }[];
    bio?: string;
    location?: { coordinates?: number[] };
    serviceRadiusKm?: number;
    isAvailableNow?: boolean;
    digitalId?: string;
    trustScore?: number;
    ratingAvg?: number;
    ratingCount?: number;
    jobsCompleted?: number;
    completionRate?: number;
    responseRate?: number;
    isPremium?: boolean;
    verification?: { status?: string; phoneVerified?: boolean };
  };
};

// Shape of GET /reviews/user/:userId
export type ReviewsPayload = {
  summary: { count: number; average: number | null };
  items: { id: string; rating: number; tags: string[]; comment?: string; createdAt: string; fromName: string | null }[];
};
