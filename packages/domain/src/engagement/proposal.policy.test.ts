import { describe, it, expect } from 'vitest';
import {
  canTransitionProposalStatus,
  assertCanTransitionProposalStatus,
  assertProposalSubmitter,
  assertJobClient,
  validateBidAmount,
  validateCoverLetter,
  InvalidProposalTransitionError,
} from './proposal.policy';
import { ForbiddenError, DomainError } from '../identity/auth.errors';

describe('Proposal Policy', () => {
  describe('Proposal Status Transitions', () => {
    it('allows valid transitions from SUBMITTED', () => {
      expect(canTransitionProposalStatus('SUBMITTED', 'WITHDRAWN')).toBe(true);
      expect(canTransitionProposalStatus('SUBMITTED', 'ACCEPTED')).toBe(true);
      expect(canTransitionProposalStatus('SUBMITTED', 'REJECTED')).toBe(true);
      expect(canTransitionProposalStatus('SUBMITTED', 'EXPIRED')).toBe(true);
    });

    it('rejects invalid transitions from terminal states', () => {
      expect(canTransitionProposalStatus('ACCEPTED', 'SUBMITTED')).toBe(false);
      expect(canTransitionProposalStatus('WITHDRAWN', 'ACCEPTED')).toBe(false);
      expect(canTransitionProposalStatus('REJECTED', 'ACCEPTED')).toBe(false);
      expect(canTransitionProposalStatus('EXPIRED', 'SUBMITTED')).toBe(false);
    });

    it('throws InvalidProposalTransitionError on illegal transition', () => {
      expect(() => assertCanTransitionProposalStatus('ACCEPTED', 'REJECTED')).toThrow(
        InvalidProposalTransitionError,
      );
    });
  });

  describe('Authorization Assertions', () => {
    it('assertProposalSubmitter allows owner and rejects other users', () => {
      expect(() => assertProposalSubmitter('user-1', 'user-1')).not.toThrow();
      expect(() => assertProposalSubmitter('user-2', 'user-1')).toThrow(ForbiddenError);
    });

    it('assertJobClient allows client and rejects non-client', () => {
      expect(() => assertJobClient('client-1', 'client-1')).not.toThrow();
      expect(() => assertJobClient('client-2', 'client-1')).toThrow(ForbiddenError);
    });
  });

  describe('Proposal Validations', () => {
    it('validates bid amount', () => {
      expect(() => validateBidAmount(100)).not.toThrow();
      expect(() => validateBidAmount(BigInt(5000))).not.toThrow();
      expect(() => validateBidAmount(0)).toThrow(DomainError);
      expect(() => validateBidAmount(-50)).toThrow(DomainError);
    });

    it('validates cover letter length', () => {
      expect(() => validateCoverLetter('This is a sufficiently long cover letter proposal.')).not.toThrow();
      expect(() => validateCoverLetter('Too short')).toThrow(DomainError);
      expect(() => validateCoverLetter('')).toThrow(DomainError);
    });
  });
});
