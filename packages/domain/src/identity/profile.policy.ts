import { z } from 'zod';
import { ForbiddenError } from './auth.errors';

export function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase();
}

export const handleSchema = z
  .string()
  .trim()
  .min(3, 'Handle must be at least 3 characters.')
  .max(30, 'Handle must be at most 30 characters.')
  .regex(/^[a-z0-9-]+$/, 'Handle may only contain lowercase letters, numbers, and hyphens.')
  .transform(normalizeHandle);

export function requireProfileOwner(actorUserId: string, profileUserId: string): void {
  if (actorUserId !== profileUserId) {
    throw new ForbiddenError('You can only modify your own profile.');
  }
}

export function validateDateRange(startDate: Date, endDate?: Date | null): boolean {
  if (!endDate) return true;
  return endDate >= startDate;
}
