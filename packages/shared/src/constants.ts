import type { TradeKey } from './types.js';

export const PLATFORM_FEE_RATE = 0.08;

export const CITY_CONFIG = {
  key: 'meerut',
  name: 'Meerut',
  state: 'Uttar Pradesh',
  country: 'India',
  center: { type: 'Point' as const, coordinates: [77.7064, 28.9845] as [number, number] },
  defaultSearchRadiusKm: 10,
  emergencyRadiiKm: [2, 5, 10] as const,
  expandEverySeconds: 40,
  emergencyTimeoutSeconds: 180,
  avgSpeedKmh: 22,
};

export const TRADES: Record<
  TradeKey,
  {
    key: TradeKey;
    name: { en: string; hi: string };
    icon: string;
    baseRateHour: number;
    baseRateDay: number;
    minRate: number;
    maxRate: number;
  }
> = {
  mason: {
    key: 'mason',
    name: { en: 'Mason', hi: 'राज मिस्त्री' },
    icon: 'brick',
    baseRateHour: 80,
    baseRateDay: 600,
    minRate: 50,
    maxRate: 150,
  },
  electrician: {
    key: 'electrician',
    name: { en: 'Electrician', hi: 'बिजली मिस्त्री' },
    icon: 'zap',
    baseRateHour: 150,
    baseRateDay: 1000,
    minRate: 80,
    maxRate: 300,
  },
  plumber: {
    key: 'plumber',
    name: { en: 'Plumber', hi: 'प्लंबर' },
    icon: 'droplet',
    baseRateHour: 150,
    baseRateDay: 1000,
    minRate: 80,
    maxRate: 300,
  },
  carpenter: {
    key: 'carpenter',
    name: { en: 'Carpenter', hi: 'बढ़ई' },
    icon: 'hammer',
    baseRateHour: 120,
    baseRateDay: 800,
    minRate: 70,
    maxRate: 250,
  },
  painter: {
    key: 'painter',
    name: { en: 'Painter', hi: 'पेंटर' },
    icon: 'paintbrush',
    baseRateHour: 100,
    baseRateDay: 700,
    minRate: 60,
    maxRate: 200,
  },
  construction_labour: {
    key: 'construction_labour',
    name: { en: 'Construction labour', hi: 'निर्माण मजदूर' },
    icon: 'hard-hat',
    baseRateHour: 60,
    baseRateDay: 500,
    minRate: 40,
    maxRate: 120,
  },
  cleaner: {
    key: 'cleaner',
    name: { en: 'Cleaner', hi: 'सफाई कर्मी' },
    icon: 'sparkles',
    baseRateHour: 80,
    baseRateDay: 500,
    minRate: 40,
    maxRate: 150,
  },
  repair_technician: {
    key: 'repair_technician',
    name: { en: 'Repair technician', hi: 'मरम्मत तकनीशियन' },
    icon: 'wrench',
    baseRateHour: 150,
    baseRateDay: 1000,
    minRate: 80,
    maxRate: 350,
  },
};

export const TRADE_LIST = Object.values(TRADES);

export const MATCH_WEIGHTS = {
  skill: 30,
  distance: 20,
  trust: 20,
  availability: 10,
  priceFit: 10,
  pastSuccess: 5,
  response: 5,
} as const;

export const TRUST_WEIGHTS = {
  rating: 0.35,
  completion: 0.2,
  verification: 0.15,
  response: 0.1,
  experience: 0.1,
  punctuality: 0.1,
} as const;

export const LANGUAGES = ['en', 'hi', 'pa', 'bn', 'mr'] as const;

export const DEMO_OTP = '123456';
