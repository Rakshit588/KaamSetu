export const ROLES = ['customer', 'worker', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const CUSTOMER_TYPES = [
  'homeowner',
  'contractor',
  'small_business',
  'housing_society',
  'commercial',
] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const TRADE_KEYS = [
  'mason',
  'electrician',
  'plumber',
  'carpenter',
  'painter',
  'construction_labour',
  'cleaner',
  'repair_technician',
] as const;
export type TradeKey = (typeof TRADE_KEYS)[number];

export const VERIFICATION_STATUSES = ['none', 'pending', 'verified', 'rejected'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const ID_TYPES = ['aadhaar', 'voter_id', 'dl'] as const;
export type IdType = (typeof ID_TYPES)[number];

export const BOOKING_STATUSES = [
  'requested',
  'accepted',
  'on_the_way',
  'in_progress',
  'completed',
  'paid',
  'cancelled',
  'disputed',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const REVIEW_TAGS = ['punctual', 'skilled', 'polite', 'fair-price'] as const;
export type ReviewTag = (typeof REVIEW_TAGS)[number];

export const URGENCY_LEVELS = ['normal', 'same_day', 'emergency'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export type GeoPoint = {
  type: 'Point';
  coordinates: [number, number];
};

export type LocalizedName = { en: string; hi: string };

export type Skill = {
  trade: TradeKey;
  experienceYears: number;
  hourlyRate?: number;
  dailyRate?: number;
};

export type ReviewInput = {
  rating: number;
  createdAt: Date;
};

export type TrustScoreInput = {
  reviews: ReviewInput[];
  jobsCompleted: number;
  jobsCancelled: number;
  jobsAccepted: number;
  phoneVerified: boolean;
  verificationStatus: VerificationStatus;
  responseRate: number;
  avgResponseMinutes: number;
  onTimeRate: number;
  upheldDisputes: number;
  fraudFlags: number;
};

export type TrustScoreBreakdown = {
  rating: number;
  completion: number;
  verification: number;
  response: number;
  experience: number;
  punctuality: number;
  penalties: number;
  total: number;
};

export type PriceEstimateInput = {
  baseRateHour: number;
  baseRateDay: number;
  minRate: number;
  maxRate: number;
  workerHourlyRate?: number;
  estimatedDurationHrs: number;
  urgency: UrgencyLevel;
  isNight: boolean;
  platformFeeRate?: number;
  emergencyIntensity?: number;
};

export type PriceBreakdown = {
  workerPay: number;
  urgencyMultiplier: number;
  urgencySurcharge: number;
  platformFee: number;
  total: number;
  min: number;
  max: number;
};

export type MatchCandidate = {
  workerId: string;
  skillMatch: number;
  distanceKm: number;
  searchRadiusKm: number;
  trustScore: number;
  isAvailableNow: boolean;
  priceFit: number;
  pastSuccessWithCustomer: number;
  responseRate: number;
};

export type MatchReason = { key: string; label: string; contribution: number };

export type MatchResult = {
  workerId: string;
  score: number;
  reasons: MatchReason[];
};
