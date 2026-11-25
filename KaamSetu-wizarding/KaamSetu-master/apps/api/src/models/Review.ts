import { Schema, model, Types } from 'mongoose';
import { REVIEW_TAGS } from '@kaamsetu/shared';

const reviewSchema = new Schema(
  {
    bookingId: { type: Types.ObjectId, ref: 'Booking', required: true, index: true },
    fromUserId: { type: Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    tags: [{ type: String, enum: REVIEW_TAGS }],
    comment: String,
  },
  { timestamps: true },
);

reviewSchema.index({ toUserId: 1, createdAt: -1 });
reviewSchema.index({ bookingId: 1, fromUserId: 1 }, { unique: true });

export const Review = model('Review', reviewSchema);
