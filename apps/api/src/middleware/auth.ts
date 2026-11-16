import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from '../errors.js';
import { User } from '../models/User.js';
import type { Role } from '@kaamsetu/shared';

export type AuthPayload = { sub: string; role: Role | null };

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: Role | null;
    }
  }
}

export function signAccessToken(userId: string, role: Role | null): string {
  return jwt.sign({ sub: userId, role } satisfies AuthPayload, config.jwtAccessSecret, {
    expiresIn: config.accessTtl as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, typ: 'refresh' }, config.jwtRefreshSecret, {
    expiresIn: config.refreshTtl as jwt.SignOptions['expiresIn'],
    jwtid: randomUUID(),
  });
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Missing token', 'UNAUTHENTICATED');
  try {
    const payload = jwt.verify(header.slice(7), config.jwtAccessSecret) as AuthPayload;
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token', 'UNAUTHENTICATED');
  }
}

export function requireRole(...roles: Role[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userId) throw new AppError(401, 'Missing token', 'UNAUTHENTICATED');
    const user = await User.findById(req.userId);
    if (!user) throw new AppError(401, 'User not found', 'UNAUTHENTICATED');
    if (!user.role || !roles.includes(user.role as Role)) {
      throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    }
    req.userRole = user.role as Role;
    next();
  };
}
