import { describe, it, expect } from 'vitest';
import {
  canTransitionJobStatus,
  assertCanTransitionJobStatus,
  assertJobOwnership,
  assertJobCanAcceptProposals,
  InvalidStateTransitionError,
} from './job.policy';
import {
  validateBudget,
  validateJobTitle,
  validateJobDescription,
  normalizeCurrency,
  InvalidBudgetError,
  InvalidJobTitleError,
  InvalidJobDescriptionError,
} from './job.entity';

describe('Job Policy & State Machine', () => {
  describe('State Machine Transitions', () => {
    it('allows valid forward transitions from DRAFT to PUBLISHED', () => {
      expect(canTransitionJobStatus('DRAFT', 'PUBLISHED')).toBe(true);
      expect(() => assertCanTransitionJobStatus('DRAFT', 'PUBLISHED')).not.toThrow();
    });

    it('allows transitions from PUBLISHED to PAUSED and CLOSED', () => {
      expect(canTransitionJobStatus('PUBLISHED', 'PAUSED')).toBe(true);
      expect(canTransitionJobStatus('PUBLISHED', 'CLOSED')).toBe(true);
    });

    it('allows unpausing from PAUSED back to PUBLISHED', () => {
      expect(canTransitionJobStatus('PAUSED', 'PUBLISHED')).toBe(true);
    });

    it('rejects invalid backward transitions from CLOSED to PUBLISHED', () => {
      expect(canTransitionJobStatus('CLOSED', 'PUBLISHED')).toBe(false);
      expect(() => assertCanTransitionJobStatus('CLOSED', 'PUBLISHED')).toThrow(
        InvalidStateTransitionError,
      );
    });

    it('rejects any transition from ARCHIVED', () => {
      expect(canTransitionJobStatus('ARCHIVED', 'PUBLISHED')).toBe(false);
      expect(canTransitionJobStatus('ARCHIVED', 'DRAFT')).toBe(false);
    });
  });

  describe('Authorization & Proposals', () => {
    it('allows job owner to manage their job', () => {
      expect(() => assertJobOwnership('user-1', 'user-1')).not.toThrow();
    });

    it('rejects non-owner modifications', () => {
      expect(() => assertJobOwnership('user-1', 'user-2')).toThrow(/only modify your own/);
    });

    it('allows proposals only when PUBLISHED', () => {
      expect(() => assertJobCanAcceptProposals('PUBLISHED')).not.toThrow();
      expect(() => assertJobCanAcceptProposals('DRAFT')).toThrow(/Only 'PUBLISHED' jobs/);
      expect(() => assertJobCanAcceptProposals('PAUSED')).toThrow(/Only 'PUBLISHED' jobs/);
      expect(() => assertJobCanAcceptProposals('CLOSED')).toThrow(/Only 'PUBLISHED' jobs/);
    });
  });

  describe('Entity Validation', () => {
    it('validates budget ranges properly', () => {
      expect(() => validateBudget(100, 500)).not.toThrow();
      expect(() => validateBudget(BigInt(100), BigInt(500))).not.toThrow();
      expect(() => validateBudget(500, 100)).toThrow(InvalidBudgetError);
      expect(() => validateBudget(-10, 100)).toThrow(InvalidBudgetError);
    });

    it('validates job titles', () => {
      expect(validateJobTitle('  Senior Rust Engineer  ')).toBe('Senior Rust Engineer');
      expect(() => validateJobTitle('Rust')).toThrow(InvalidJobTitleError);
    });

    it('validates job descriptions', () => {
      const valid = 'We are building an audited cross-chain bridge escrow contract.';
      expect(validateJobDescription(valid)).toBe(valid);
      expect(() => validateJobDescription('Too short')).toThrow(InvalidJobDescriptionError);
    });

    it('normalizes currencies', () => {
      expect(normalizeCurrency('usdc')).toBe('USDC');
      expect(normalizeCurrency('eth')).toBe('ETH');
      expect(normalizeCurrency('unknown')).toBe('USD');
      expect(normalizeCurrency(null)).toBe('USD');
    });
  });
});
