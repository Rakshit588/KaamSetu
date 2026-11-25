import { Schema, model } from 'mongoose';

const waitlistSchema = new Schema(
  {
    phone: String,
    email: String,
    interest: String,
    feature: String,
  },
  { timestamps: true },
);

export const Waitlist = model('Waitlist', waitlistSchema);
