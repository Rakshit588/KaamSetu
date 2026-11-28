
import { createHash, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { DEMO_OTP } from '@kaamsetu/shared';
import { createRouter } from '../utils/router.js';
import { config } from '../config.js';
import { AppError } from '../errors.js';
import { requireAuth, signAccessToken, signRefreshToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CustomerProfile } from '../models/CustomerProfile.js';
import { User } from '../models/User.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { createOtpProvider } from '../providers/otp.js';
import { digitalWorkerId, normalizePhone, referralCode, sha256 } from '../utils/crypto.js';
import { recomputeWorkerTrust } from '../services/trust.js';

const otpProvider = createOtpProvider();

const MAX_OTP_ATTEMPTS = 5;
const OTP_WINDOW_MS = 15 * 60 * 1000;
const MAX_OTP_REQUESTS = 5;

const phoneSchema = z.object({
  body: z.object({
    phone: z.string().min(10),
    deviceId: z.string().optional(),
  }),
});

export const authRouter = createRouter();

// Request OTP
authRouter.post('/otp/request', validate(phoneSchema), async (req, res) => {
  let phone: string;

  try {
    phone = normalizePhone(req.body.phone);
  } catch {
    throw new AppError(400, 'Enter a valid 10-digit Indian mobile number', 'INVALID_PHONE');
  }

  const now = new Date();

  let user = await User.findOne({ phone });

  if (!user) {
    user = await User.create({ phone, name: '' });
  }

  const windowStart = user.otpRequestWindowStart
    ? new Date(user.otpRequestWindowStart)
    : new Date(0);

  if (now.getTime() - windowStart.getTime() > OTP_WINDOW_MS) {
    user.otpRequestWindowStart = now;
    user.otpRequestCount = 0;
  }

  if (user.otpRequestCount >= MAX_OTP_REQUESTS) {
    throw new AppError(429, 'Too many OTP requests. Try again later.', 'OTP_RATE_LIMIT');
  }

  const otp =
    config.env === 'production' && config.otpProvider !== 'dev'
      ? randomOtp()
      : DEMO_OTP;

  user.otpHash = sha256(otp);
  user.otpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  user.otpAttempts = 0;
  user.otpRequestCount += 1;

  if (req.body.deviceId && !user.deviceIds.includes(req.body.deviceId)) {
    user.deviceIds.push(req.body.deviceId);
  }

  await user.save();
  await otpProvider.send(phone, otp);

  res.json({
    ok: true,
    demo: config.otpProvider === 'dev',
    message: 'OTP sent',
  });
});

// Verify OTP
authRouter.post(
  '/otp/verify',
  validate(
    z.object({
      body: z.object({
        phone: z.string().min(10),
        otp: z.string().min(4),
        deviceId: z.string().optional(),
      }),
    }),
  ),
  async (req, res) => {
    let phone: string;

    try {
      phone = normalizePhone(req.body.phone);
    } catch {
      throw new AppError(400, 'Enter a valid 10-digit Indian mobile number', 'INVALID_PHONE');
    }

    const user = await User.findOne({ phone });

    if (!user || !user.otpHash || !user.otpExpiresAt) {
      throw new AppError(400, 'Request an OTP first', 'OTP_NOT_REQUESTED');
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new AppError(400, 'OTP expired', 'OTP_EXPIRED');
    }

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError(429, 'Too many incorrect attempts', 'OTP_LOCKED');
    }

    const incoming = sha256(req.body.otp);

    const valid =
      incoming.length === user.otpHash.length &&
      timingSafeEqual(Buffer.from(incoming), Buffer.from(user.otpHash));

    if (!valid) {
      user.otpAttempts += 1;
      await user.save();

      throw new AppError(400, 'Incorrect OTP', 'OTP_INVALID');
    }

    user.otpHash = undefined;
    user.otpAttempts = 0;

    if (req.body.deviceId && !user.deviceIds.includes(req.body.deviceId)) {
      user.deviceIds.push(req.body.deviceId);
    }

    const refresh = signRefreshToken(String(user._id));

    user.refreshTokens.push({
      hash: sha256(refresh),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceId: req.body.deviceId,
    });

    await user.save();

    const accessToken = signAccessToken(String(user._id), user.role ?? null);

    res.json({
      accessToken,
      refreshToken: refresh,
      user: publicUser(user),
      needsRole: !user.role,
    });
  },
);

// Refresh access token
authRouter.post(
  '/refresh',
  validate(z.object({ body: z.object({ refreshToken: z.string().min(10) }) })),
  async (req, res) => {
    try {
      const payload = jwt.verify(req.body.refreshToken, config.jwtRefreshSecret) as {
        sub: string;
        typ?: string;
        jti?: string;
      };

      if (payload.typ !== 'refresh' || !payload.jti) {
        throw new AppError(401, 'Invalid refresh token', 'UNAUTHENTICATED');
      }

      const user = await User.findById(payload.sub);

      if (!user) {
        throw new AppError(401, 'Invalid refresh token', 'UNAUTHENTICATED');
      }

      const hash = sha256(req.body.refreshToken);

      const storedIndex = user.refreshTokens.findIndex(
        (token) => token.hash === hash && token.expiresAt > new Date(),
      );

      if (storedIndex === -1) {
        throw new AppError(401, 'Refresh token revoked', 'UNAUTHENTICATED');
      }

      const stored = user.refreshTokens[storedIndex];

      if (!stored) {
        throw new AppError(401, 'Refresh token revoked', 'UNAUTHENTICATED');
      }

      // Consume the old refresh token.
      user.refreshTokens.splice(storedIndex, 1);

      const next = signRefreshToken(String(user._id));

      user.refreshTokens.push({
        hash: sha256(next),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deviceId: stored.deviceId ?? undefined,
      });

      await user.save();

      res.json({
        accessToken: signAccessToken(String(user._id), user.role ?? null),
        refreshToken: next,
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }

      throw new AppError(401, 'Invalid refresh token', 'UNAUTHENTICATED');
    }
  },
);

// Logout
authRouter.post('/logout', requireAuth, async (req, res) => {
  const token = req.body?.refreshToken as string | undefined;

  if (token) {
    await User.updateOne(
      { _id: req.userId },
      { $pull: { refreshTokens: { hash: sha256(token) } } },
    );
  } else {
    await User.updateOne(
      { _id: req.userId },
      { $set: { refreshTokens: [] } },
    );
  }

  res.json({ ok: true });
});

// Current user
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    throw new AppError(404, 'User not found', 'NOT_FOUND');
  }

  res.json({ user: publicUser(user) });
});

// Select account role
authRouter.post(
  '/role',
  requireAuth,
  validate(
    z.object({
      body: z.object({
        role: z.enum(['customer', 'worker']),
        name: z.string().min(1).max(80).optional(),
        language: z.string().optional(),
      }),
    }),
  ),
  async (req, res) => {
    const user = await User.findById(req.userId);

    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    if (user.role === 'admin') {
      throw new AppError(400, 'Admin role cannot be changed', 'FORBIDDEN');
    }

    if (user.role && user.role !== req.body.role) {
      throw new AppError(400, 'Role already selected', 'ROLE_LOCKED');
    }

    user.role = req.body.role;

    if (req.body.name) {
      user.name = req.body.name;
    }

    if (req.body.language) {
      user.language = req.body.language;
    }

    if (!user.referralCode) {
      user.referralCode = referralCode();
    }

    await user.save();

    if (user.role === 'worker') {
      const existing = await WorkerProfile.findOne({ userId: user._id });

      if (!existing) {
        await WorkerProfile.create({
          userId: user._id,
          digitalId: digitalWorkerId(),
          verification: {
            phoneVerified: true,
            status: 'none',
          },
        });

        await recomputeWorkerTrust(String(user._id));
      }
    } else {
      const existing = await CustomerProfile.findOne({ userId: user._id });

      if (!existing) {
        await CustomerProfile.create({ userId: user._id });
      }
    }

    res.json({
      user: publicUser(user),
      accessToken: signAccessToken(String(user._id), user.role ?? null),
    });
  },
);

// Safe public user response shape.
// role is optional because Mongoose's inferred document type makes it optional.
type PublicUserInput = {
  _id: unknown;
  phone: string;
  name: string;
  role?: string | null;
  language: string;
  avatarUrl: string;
  referralCode?: string | null;
  walletBalance: number;
};

function publicUser(user: PublicUserInput) {
  return {
    id: String(user._id),
    phone: user.phone,
    name: user.name,
    role: user.role ?? null,
    language: user.language,
    avatarUrl: user.avatarUrl,
    referralCode: user.referralCode,
    walletBalance: user.walletBalance,
  };
}

function randomOtp(): string {
  return String(
    100000 +
      (createHash('sha256').update(String(Date.now())).digest()[0] % 900000),
  );
}
