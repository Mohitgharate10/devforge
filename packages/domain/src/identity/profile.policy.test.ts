import { describe, it, expect } from 'vitest';
import {
  normalizeHandle,
  handleSchema,
  requireProfileOwner,
  validateDateRange,
} from './profile.policy';
import { ForbiddenError } from './auth.errors';

describe('profile.policy', () => {
  describe('normalizeHandle', () => {
    it('normalizes handles to lowercase and trimmed', () => {
      expect(normalizeHandle('  AliceDev  ')).toBe('alicedev');
    });
  });

  describe('handleSchema', () => {
    it('accepts valid handles with hyphens and numbers', () => {
      expect(handleSchema.parse('web3-developer-99')).toBe('web3-developer-99');
    });

    it('rejects handles with special characters or uppercase', () => {
      expect(() => handleSchema.parse('web3_developer!')).toThrow();
    });

    it('rejects handles shorter than 3 chars', () => {
      expect(() => handleSchema.parse('ab')).toThrow();
    });
  });

  describe('requireProfileOwner', () => {
    it('throws ForbiddenError when user IDs do not match', () => {
      expect(() => requireProfileOwner('user-1', 'user-2')).toThrow(ForbiddenError);
    });

    it('passes when user IDs match', () => {
      expect(() => requireProfileOwner('user-1', 'user-1')).not.toThrow();
    });
  });

  describe('validateDateRange', () => {
    it('returns true when end date is greater than or equal to start date', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2026-01-01');
      expect(validateDateRange(start, end)).toBe(true);
    });

    it('returns false when end date is earlier than start date', () => {
      const start = new Date('2026-01-01');
      const end = new Date('2025-01-01');
      expect(validateDateRange(start, end)).toBe(false);
    });

    it('returns true when end date is null or undefined', () => {
      const start = new Date('2025-01-01');
      expect(validateDateRange(start, null)).toBe(true);
      expect(validateDateRange(start, undefined)).toBe(true);
    });
  });
});
