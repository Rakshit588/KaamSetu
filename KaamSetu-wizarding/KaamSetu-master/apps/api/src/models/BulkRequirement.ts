import { Schema, model, Types } from 'mongoose';
import { TRADE_KEYS } from '@kaamsetu/shared';

const bulkSchema = new Schema(
  {
    customerId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    trade: { type: String, enum: TRADE_KEYS, required: true },
    headcount: { type: Number, required: true, min: 2 },
    days: { type: Number, required: true, min: 1 },
    description: String,
    address: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.7064, 28.9845] },
    },
    scheduledFor: Date,
    status: { type: String, enum: ['open', 'filled', 'cancelled'], default: 'open' },
    bookingIds: { type: [Types.ObjectId], default: [] },
  },
  { timestamps: true },
);

export const BulkRequirement = model('BulkRequirement', bulkSchema);
