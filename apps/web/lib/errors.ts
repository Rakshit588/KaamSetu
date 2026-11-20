import { ApiError } from './api';

export function errorMessage(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return e instanceof ApiError ? e.message : fallback;
}
