import { Schema, model, Types } from 'mongoose';

const messageSchema = new Schema(
  {
    bookingId: { type: Types.ObjectId, ref: 'Booking', required: true, index: true },
    senderId: { type: Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    readAt: Date,
  },
  { timestamps: true },
);

export const Message = model('Message', messageSchema);
