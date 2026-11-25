import { Schema, model, Types } from 'mongoose';
import { CUSTOMER_TYPES } from '@kaamsetu/shared';

const addressSchema = new Schema(
  {
    label: String,
    address: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.7064, 28.9845] },
    },
  },
  { _id: true },
);

const customerSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    savedAddresses: { type: [addressSchema], default: [] },
    customerType: { type: String, enum: CUSTOMER_TYPES, default: 'homeowner' },
    contractorSubscription: {
      plan: { type: String, default: null },
      validUntil: Date,
    },
    favouriteWorkers: { type: [Types.ObjectId], default: [] },
  },
  { timestamps: true },
);

export const CustomerProfile = model('CustomerProfile', customerSchema);
