import { Schema, model, Types } from 'mongoose';
import type { Role } from '@kaamsetu/shared';

const refreshTokenSchema = new Schema(
  {
    hash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    deviceId: String,
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'worker', 'admin'], default: undefined },
    language: { type: String, default: 'en' },
    avatarUrl: { type: String, default: '' },
    fcmTokens: { type: [String], default: [] },
    deviceIds: { type: [String], default: [] },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Types.ObjectId, ref: 'User' },
    walletBalance: { type: Number, default: 0 },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
    otpHash: String,
    otpExpiresAt: Date,
    otpAttempts: { type: Number, default: 0 },
    otpRequestCount: { type: Number, default: 0 },
    otpRequestWindowStart: Date,
  },
  { timestamps: true },
);

export type UserDoc = {
  _id: Types.ObjectId;
  phone: string;
  name: string;
  role: Role | null;
  language: string;
  avatarUrl: string;
  fcmTokens: string[];
  deviceIds: string[];
  referralCode?: string;
  referredBy?: Types.ObjectId;
  walletBalance: number;
  refreshTokens: { hash: string; expiresAt: Date; deviceId?: string }[];
  otpHash?: string;
  otpExpiresAt?: Date;
  otpAttempts: number;
  otpRequestCount: number;
  otpRequestWindowStart?: Date;
};

export const User = model('User', userSchema);
