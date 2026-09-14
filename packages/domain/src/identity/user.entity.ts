import { z } from 'zod';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be at most 128 characters.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one digit.')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.');

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Display name must be at least 2 characters.')
  .max(100, 'Display name must be at most 100 characters.');

export const emailSchema = z.string().email('Invalid email address.').transform(normalizeEmail);

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

const VALID_STATUS_TRANSITIONS: Record<UserStatus, UserStatus[]> = {
  ACTIVE: ['SUSPENDED', 'CLOSED'],
  SUSPENDED: ['ACTIVE'],
  CLOSED: [],
};

export function canTransitionStatus(current: UserStatus, target: UserStatus): boolean {
  return VALID_STATUS_TRANSITIONS[current].includes(target);
}
