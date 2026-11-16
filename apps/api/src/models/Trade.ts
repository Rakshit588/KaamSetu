import { Schema, model } from 'mongoose';
import { TRADE_KEYS } from '@kaamsetu/shared';

const tradeSchema = new Schema(
  {
    key: { type: String, enum: TRADE_KEYS, required: true, unique: true },
    name: { en: String, hi: String },
    icon: String,
    baseRateHour: Number,
    baseRateDay: Number,
    minRate: Number,
    maxRate: Number,
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Trade = model('Trade', tradeSchema);
