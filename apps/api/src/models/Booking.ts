import { Schema, model, Types } from 'mongoose';
import { BOOKING_STATUSES, TRADE_KEYS } from '@kaamsetu/shared';

const bookingSchema = new Schema(
  {
    customerId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    workerId: { type: Types.ObjectId, ref: 'User', index: true },
    trade: { type: String, enum: TRADE_KEYS, required: true },
    description: String,
    photos: { type: [String], default: [] },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.7064, 28.9845] },
    },
    address: String,
    scheduledFor: Date,
    isEmergency: { type: Boolean, default: false },
    estimatedDurationHrs: Number,
    priceEstimate: {
      min: Number,
      max: Number,
      urgencyMultiplier: Number,
    },
    finalPrice: Number,
    platformFee: Number,
    status: { type: String, enum: BOOKING_STATUSES, default: 'requested', index: true },
    statusTimeline: {
      type: [{ status: String, at: Date, note: String }],
      default: [],
    },
    payment: {
      provider: String,
      orderId: String,
      status: { type: String, default: 'unpaid' },
      method: String,
      paidAt: Date,
    },
    startOtp: String,
    completionOtp: String,
    startGps: { type: [Number], default: undefined },
    endGps: { type: [Number], default: undefined },
    cancelReason: String,
  },
  { timestamps: true },
);

bookingSchema.index({ location: '2dsphere' });
bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ workerId: 1, createdAt: -1 });

export const Booking = model('Booking', bookingSchema);
