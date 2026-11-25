import { Schema, model, Types } from 'mongoose';

const walletSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Types.ObjectId, ref: 'Booking' },
    type: {
      type: String,
      enum: ['job_payout', 'referral', 'premium', 'subscription', 'refund'],
      required: true,
    },
    amount: { type: Number, required: true },
    note: String,
  },
  { timestamps: true },
);

walletSchema.index({ userId: 1, createdAt: -1 });

export const WalletTransaction = model('WalletTransaction', walletSchema);
