import { describe, it, expect } from 'vitest';
import {
  canTransitionContractStatus,
  assertCanTransitionContractStatus,
  canTransitionMilestoneStatus,
  assertCanTransitionMilestoneStatus,
  canTransitionDeliveryStatus,
  assertCanTransitionDeliveryStatus,
  assertContractParticipant,
  assertContractRole,
  validateMilestonesSum,
  assertMilestonesSum,
  InvalidContractTransitionError,
  InvalidMilestoneTransitionError,
  InvalidDeliveryTransitionError,
} from './contract.policy';
import { ForbiddenError, DomainError } from '../identity/auth.errors';

describe('Contract & Milestone Policy', () => {
  describe('Contract Transitions', () => {
    it('allows valid transitions from ACTIVE', () => {
      expect(canTransitionContractStatus('ACTIVE', 'COMPLETED')).toBe(true);
      expect(canTransitionContractStatus('ACTIVE', 'DISPUTED')).toBe(true);
      expect(canTransitionContractStatus('ACTIVE', 'TERMINATED')).toBe(true);
    });

    it('allows dispute resolution', () => {
      expect(canTransitionContractStatus('DISPUTED', 'ACTIVE')).toBe(true);
      expect(canTransitionContractStatus('DISPUTED', 'COMPLETED')).toBe(true);
      expect(canTransitionContractStatus('DISPUTED', 'TERMINATED')).toBe(true);
    });

    it('rejects transitions from terminal states', () => {
      expect(canTransitionContractStatus('COMPLETED', 'ACTIVE')).toBe(false);
      expect(canTransitionContractStatus('TERMINATED', 'ACTIVE')).toBe(false);
    });

    it('throws InvalidContractTransitionError', () => {
      expect(() => assertCanTransitionContractStatus('COMPLETED', 'ACTIVE')).toThrow(
        InvalidContractTransitionError,
      );
    });
  });

  describe('Milestone Transitions', () => {
    it('allows lifecycle progression', () => {
      expect(canTransitionMilestoneStatus('PENDING', 'FUNDED')).toBe(true);
      expect(canTransitionMilestoneStatus('FUNDED', 'IN_PROGRESS')).toBe(true);
      expect(canTransitionMilestoneStatus('IN_PROGRESS', 'SUBMITTED')).toBe(true);
      expect(canTransitionMilestoneStatus('SUBMITTED', 'APPROVED')).toBe(true);
      expect(canTransitionMilestoneStatus('SUBMITTED', 'IN_PROGRESS')).toBe(true);
    });

    it('allows dispute on funded milestones', () => {
      expect(canTransitionMilestoneStatus('FUNDED', 'DISPUTED')).toBe(true);
      expect(canTransitionMilestoneStatus('IN_PROGRESS', 'DISPUTED')).toBe(true);
      expect(canTransitionMilestoneStatus('SUBMITTED', 'DISPUTED')).toBe(true);
    });

    it('throws on invalid milestone transition', () => {
      expect(() => assertCanTransitionMilestoneStatus('APPROVED', 'PENDING')).toThrow(
        InvalidMilestoneTransitionError,
      );
    });
  });

  describe('Delivery Transitions', () => {
    it('allows accepting and rejecting submitted delivery', () => {
      expect(canTransitionDeliveryStatus('SUBMITTED', 'ACCEPTED')).toBe(true);
      expect(canTransitionDeliveryStatus('SUBMITTED', 'REJECTED')).toBe(true);
      expect(canTransitionDeliveryStatus('ACCEPTED', 'SUBMITTED')).toBe(false);
    });

    it('throws on invalid delivery transition', () => {
      expect(() => assertCanTransitionDeliveryStatus('ACCEPTED', 'REJECTED')).toThrow(
        InvalidDeliveryTransitionError,
      );
    });
  });

  describe('Participant and Role Assertions', () => {
    const participants = [
      { userId: 'user-client', role: 'CLIENT' as const },
      { userId: 'user-freelancer', role: 'FREELANCER' as const },
    ];

    it('validates contract participants', () => {
      expect(assertContractParticipant('user-client', participants)).toBe('CLIENT');
      expect(assertContractParticipant('user-freelancer', participants)).toBe('FREELANCER');
      expect(() => assertContractParticipant('user-random', participants)).toThrow(ForbiddenError);
    });

    it('validates specific contract roles', () => {
      expect(() => assertContractRole('user-client', participants, 'CLIENT')).not.toThrow();
      expect(() => assertContractRole('user-freelancer', participants, 'CLIENT')).toThrow(ForbiddenError);
      expect(() => assertContractRole('user-client', participants, 'FREELANCER')).toThrow(ForbiddenError);
    });
  });

  describe('Milestone Sums Validation', () => {
    it('validates sums correctly with bigint and number', () => {
      expect(validateMilestonesSum([100, 200, 300], 600)).toBe(true);
      expect(validateMilestonesSum([BigInt(1000), BigInt(2000)], BigInt(3000))).toBe(true);
      expect(validateMilestonesSum([100, 200], 500)).toBe(false);
    });

    it('asserts milestone sum correctly', () => {
      expect(() => assertMilestonesSum([500, 500], 1000)).not.toThrow();
      expect(() => assertMilestonesSum([500, 400], 1000)).toThrow(DomainError);
    });
  });
});
