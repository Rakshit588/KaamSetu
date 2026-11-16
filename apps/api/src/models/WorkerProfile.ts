import { Schema, model, Types } from 'mongoose';
import { TRADE_KEYS } from '@kaamsetu/shared';

const skillSchema = new Schema(
  {
    trade: { type: String, enum: TRADE_KEYS, required: true },
    experienceYears: { type: Number, required: true, min: 0 },
    hourlyRate: Number,
    dailyRate: Number,
  },
  { _id: false },
);

const workerSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    skills: { type: [skillSchema], default: [] },
    bio: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.7064, 28.9845] },
    },
    serviceRadiusKm: { type: Number, default: 8 },
    isAvailableNow: { type: Boolean, default: false, index: true },
    availabilitySchedule: {
      type: Map,
      of: { start: String, end: String, off: Boolean },
      default: {},
    },
    verification: {
      phoneVerified: { type: Boolean, default: true },
      idType: { type: String, enum: ['aadhaar', 'voter_id', 'dl', null], default: null },
      idNumberMasked: { type: String, default: '' },
      idDocUrl: { type: String, default: '' },
      selfieUrl: { type: String, default: '' },
      kycReferenceId: { type: String, default: '' },
      status: {
        type: String,
        enum: ['none', 'pending', 'verified', 'rejected'],
        default: 'none',
      },
      verifiedAt: Date,
      rejectionReason: String,
    },
    digitalId: { type: String, unique: true, index: true },
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    trustBreakdown: { type: Schema.Types.Mixed, default: {} },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    jobsCompleted: { type: Number, default: 0 },
    jobsCancelled: { type: Number, default: 0 },
    jobsAccepted: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    responseRate: { type: Number, default: 50 },
    avgResponseMinutes: { type: Number, default: 15 },
    onTimeRate: { type: Number, default: 50 },
    earningsTotal: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    premiumUntil: Date,
    favouriteOf: { type: [Types.ObjectId], default: [] },
    upheldDisputes: { type: Number, default: 0 },
    fraudFlags: { type: Number, default: 0 },
  },
  { timestamps: true },
);

workerSchema.index({ location: '2dsphere' });
workerSchema.index({ 'skills.trade': 1, isAvailableNow: 1, trustScore: -1 });

export const WorkerProfile = model('WorkerProfile', workerSchema);
