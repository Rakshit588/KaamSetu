import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/kaamsetu',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh',
  accessTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
  refreshTtl: process.env.REFRESH_TOKEN_TTL ?? '7d',
  otpProvider: process.env.OTP_PROVIDER ?? 'dev',
  otpDevCode: process.env.OTP_CODE_DEV ?? '123456',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  platformFeeRate: Number(process.env.PLATFORM_FEE_RATE ?? 0.08),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  openaiKey: process.env.OPENAI_API_KEY ?? '',
  paymentProvider: process.env.PAYMENT_PROVIDER ?? 'mock',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
};
