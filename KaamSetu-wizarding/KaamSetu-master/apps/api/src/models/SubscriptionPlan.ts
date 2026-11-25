import { Schema, model } from 'mongoose';

const planSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    audience: { type: String, enum: ['worker', 'contractor'], required: true },
    name: { en: String, hi: String },
    priceInr: Number,
    periodDays: Number,
    perks: [String],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const SubscriptionPlan = model('SubscriptionPlan', planSchema);
