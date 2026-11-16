import { createHash, randomBytes, randomInt } from 'node:crypto';

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function maskIdNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const last4 = digits.slice(-4) || '0000';
  return `XXXX-XXXX-${last4}`;
}

export function digitalWorkerId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[randomInt(alphabet.length)];
  return `KS-${code}`;
}

export function referralCode(): string {
  return `KS${randomBytes(3).toString('hex').toUpperCase()}`;
}

export function fourDigitOtp(): string {
  return String(randomInt(1000, 10000));
}

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (input.startsWith('+') && digits.length >= 10) return `+${digits}`;
  throw new Error('Invalid Indian phone number');
}
