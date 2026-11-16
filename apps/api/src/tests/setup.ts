import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { TRADE_LIST } from '@kaamsetu/shared';
import { Trade } from '../models/Trade.js';
import { WorkerProfile } from '../models/WorkerProfile.js';

let mongo: MongoMemoryServer;

export async function setupTestDb() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test-access';
  process.env.JWT_REFRESH_SECRET = 'test-refresh';
  process.env.OTP_PROVIDER = 'dev';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Trade.insertMany(TRADE_LIST.map((t) => ({ ...t, active: true })));
  await WorkerProfile.syncIndexes();
}

export async function teardownTestDb() {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}
