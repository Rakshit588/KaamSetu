import { Schema, model } from 'mongoose';
import { TRADE_KEYS } from '@kaamsetu/shared';

const adSchema = new Schema(
  {
    title: String,
    imageUrl: String,
    link: String,
    sponsor: String,
    targetTrade: { type: String, enum: [...TRADE_KEYS, 'all'], default: 'all' },
    active: { type: Boolean, default: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Advertisement = model('Advertisement', adSchema);
