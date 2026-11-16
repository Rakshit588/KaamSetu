import { Schema, model, Types } from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: String,
    body: String,
    data: Schema.Types.Mixed,
    readAt: Date,
  },
  { timestamps: true },
);

export const Notification = model('Notification', notificationSchema);
