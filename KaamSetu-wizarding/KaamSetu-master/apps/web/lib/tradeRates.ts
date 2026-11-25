import type { TradeKey } from './trades';

// Allowed hourly rate band per trade. Mirrors TRADES in packages/shared/src/constants.ts.
export const TRADE_RATES: Record<TradeKey, { base: number; min: number; max: number }> = {
  mason: { base: 80, min: 50, max: 150 },
  electrician: { base: 150, min: 80, max: 300 },
  plumber: { base: 150, min: 80, max: 300 },
  carpenter: { base: 120, min: 70, max: 250 },
  painter: { base: 100, min: 60, max: 200 },
  construction_labour: { base: 60, min: 40, max: 120 },
  cleaner: { base: 80, min: 40, max: 150 },
  repair_technician: { base: 150, min: 80, max: 350 },
};
