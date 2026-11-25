import { Schema, model, Types } from 'mongoose';

const reportSchema = new Schema(
  {
    bookingId: { type: Types.ObjectId, ref: 'Booking' },
    raisedBy: { type: Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['open', 'reviewing', 'upheld', 'dismissed'], default: 'open' },
    adminNotes: String,
    kind: { type: String, enum: ['dispute', 'fraud_flag', 'report'], default: 'report' },
  },
  { timestamps: true },
);

export const Report = model('Report', reportSchema);
