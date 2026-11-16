import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler } from './middleware/error.js';
import { adminRouter } from './routes/admin.js';
import { aiRouter } from './routes/ai.js';
import { authRouter } from './routes/auth.js';
import { customersRouter } from './routes/customers.js';
import { pricingRouter } from './routes/pricing.js';
import { tradesRouter } from './routes/trades.js';
import { workersRouter } from './routes/workers.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
  });
  if (config.env !== 'test') {
    app.use(generalLimiter);
  }

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'kaamsetu-api', stage: '1-3' });
  });

  if (config.env !== 'test') {
    app.use('/auth/otp', otpLimiter);
  }
  app.use('/auth', authRouter);
  app.use('/trades', tradesRouter);
  app.use('/workers', workersRouter);
  app.use('/customers', customersRouter);
  app.use('/pricing', pricingRouter);
  app.use('/admin', adminRouter);
  app.use('/ai', aiRouter);

  app.use(errorHandler);
  return app;
}
