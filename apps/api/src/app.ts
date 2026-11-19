import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler } from './middleware/error.js';
import { adminRouter } from './routes/admin.js';
import { aiRouter } from './routes/ai.js';
import { authRouter } from './routes/auth.js';
import { bookingsRouter } from './routes/bookings.js';
import { chatRouter } from './routes/chat.js';
import { customersRouter } from './routes/customers.js';
import { notificationsRouter } from './routes/notifications.js';
import { pricingRouter } from './routes/pricing.js';
import { reviewsRouter } from './routes/reviews.js';
import { tradesRouter } from './routes/trades.js';
import { walletRouter } from './routes/wallet.js';
import { workersRouter } from './routes/workers.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  const isProd = config.env === 'production';
  const tooMany = {
    message: 'Too many requests. Please wait a few minutes and try again.',
    code: 'RATE_LIMITED',
  };
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 300 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooMany,
  });
  const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 10 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooMany,
  });
  if (config.env !== 'test') {
    app.use(generalLimiter);
  }

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'kaamsetu-api', stage: '1-4' });
  });

  if (config.env !== 'test') {
    app.use('/auth/otp', otpLimiter);
  }
  app.use('/auth', authRouter);
  app.use('/trades', tradesRouter);
  app.use('/workers', workersRouter);
  app.use('/customers', customersRouter);
  app.use('/pricing', pricingRouter);
  app.use('/bookings', bookingsRouter);
  app.use('/reviews', reviewsRouter);
  app.use('/chat', chatRouter);
  app.use('/notifications', notificationsRouter);
  app.use('/wallet', walletRouter);
  app.use('/admin', adminRouter);
  app.use('/ai', aiRouter);

  app.use(errorHandler);
  return app;
}