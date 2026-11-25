import { z } from 'zod';

export const pageFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export function skipLimit(page: number, limit: number) {
  return { skip: (page - 1) * limit, limit };
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
