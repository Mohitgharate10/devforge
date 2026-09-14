import { describe, it, expect } from 'vitest';
import {
  canTransitionEscrowStatus,
  assertValidEscrowTransition,
  computeVaultKey,
  canDepositEscrow,
  canReleaseEscrow,
  canRaiseDispute,
  canResolveDispute,
  canRefundEscrow,
  validateEscrowDepositInput,
} from './escrow.policy';

describe('escrow.policy', () => {
  describe('state transitions', () => {
    it('allows valid state transitions', () => {
      expect(canTransitionEscrowStatus('PENDING', 'DEPOSITED')).toBe(true);
      expect(canTransitionEscrowStatus('DEPOSITED', 'RELEASED')).toBe(true);
      expect(canTransitionEscrowStatus('DEPOSITED', 'DISPUTED')).toBe(true);
      expect(canTransitionEscrowStatus('DEPOSITED', 'REFUNDED')).toBe(true);
      expect(canTransitionEscrowStatus('DISPUTED', 'RELEASED')).toBe(true);
      expect(canTransitionEscrowStatus('DISPUTED', 'REFUNDED')).toBe(true);
    });

    it('rejects invalid state transitions', () => {
      expect(canTransitionEscrowStatus('PENDING', 'RELEASED')).toBe(false);
      expect(canTransitionEscrowStatus('RELEASED', 'DEPOSITED')).toBe(false);
      expect(canTransitionEscrowStatus('REFUNDED', 'DEPOSITED')).toBe(false);
      expect(canTransitionEscrowStatus('DISPUTED', 'DEPOSITED')).toBe(false);

      expect(() => assertValidEscrowTransition('RELEASED', 'DEPOSITED')).toThrow(
        'Invalid escrow state transition',
      );
    });
  });

  describe('vault key calculation', () => {
    it('computes deterministic 32-byte hex vault keys', () => {
      const key1 = computeVaultKey('contract-123', 0);
      const key2 = computeVaultKey('contract-123', 0);
      const key3 = computeVaultKey('contract-123', 1);

      expect(key1).toMatch(/^0x[a-f0-9]{64}$/i);
      expect(key1).toEqual(key2);
      expect(key1).not.toEqual(key3);
    });
  });

  describe('action authorizations', () => {
    const clientCtx = { userId: 'u1', isClient: true, isFreelancer: false, isAdmin: false };
    const freelancerCtx = { userId: 'u2', isClient: false, isFreelancer: true, isAdmin: false };
    const adminCtx = { userId: 'admin', isClient: false, isFreelancer: false, isAdmin: true };
    const strangerCtx = { userId: 'stranger', isClient: false, isFreelancer: false, isAdmin: false };

    it('validates deposit permissions', () => {
      expect(canDepositEscrow(clientCtx, 'PENDING')).toBe(true);
      expect(canDepositEscrow(adminCtx, 'PENDING')).toBe(true);
      expect(canDepositEscrow(freelancerCtx, 'PENDING')).toBe(false);
      expect(canDepositEscrow(clientCtx, 'DEPOSITED')).toBe(false);
    });

    it('validates release permissions', () => {
      expect(canReleaseEscrow(clientCtx, 'DEPOSITED')).toBe(true);
      expect(canReleaseEscrow(adminCtx, 'DEPOSITED')).toBe(true);
      expect(canReleaseEscrow(freelancerCtx, 'DEPOSITED')).toBe(false);
      expect(canReleaseEscrow(strangerCtx, 'DEPOSITED')).toBe(false);
    });

    it('validates dispute initiation', () => {
      expect(canRaiseDispute(clientCtx, 'DEPOSITED')).toBe(true);
      expect(canRaiseDispute(freelancerCtx, 'DEPOSITED')).toBe(true);
      expect(canRaiseDispute(adminCtx, 'DEPOSITED')).toBe(true);
      expect(canRaiseDispute(strangerCtx, 'DEPOSITED')).toBe(false);
    });

    it('validates dispute resolution', () => {
      expect(canResolveDispute(adminCtx, 'DISPUTED')).toBe(true);
      expect(canResolveDispute(clientCtx, 'DISPUTED')).toBe(false);
      expect(canResolveDispute(freelancerCtx, 'DISPUTED')).toBe(false);
    });

    it('validates refund permissions', () => {
      expect(canRefundEscrow(freelancerCtx, 'DEPOSITED')).toBe(true);
      expect(canRefundEscrow(adminCtx, 'DEPOSITED')).toBe(true);
      expect(canRefundEscrow(clientCtx, 'DEPOSITED')).toBe(false);
    });
  });

  describe('deposit input validation', () => {
    it('succeeds for valid inputs', () => {
      expect(() =>
        validateEscrowDepositInput({
          contractId: '00000000-0000-0000-0000-000000000001',
          milestoneIndex: 0,
          amount: '0.5',
          clientAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          freelancerAddress: '0x0000000000000000000000000000000000000001',
        }),
      ).not.toThrow();
    });

    it('rejects invalid amounts and addresses', () => {
      expect(() =>
        validateEscrowDepositInput({
          contractId: 'c1',
          milestoneIndex: 0,
          amount: '0',
          clientAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          freelancerAddress: '0x0000000000000000000000000000000000000001',
        }),
      ).toThrow('Escrow amount must be greater than zero');

      expect(() =>
        validateEscrowDepositInput({
          contractId: 'c1',
          milestoneIndex: 0,
          amount: '1.0',
          clientAddress: 'invalid-address',
          freelancerAddress: '0x0000000000000000000000000000000000000001',
        }),
      ).toThrow('Invalid client Ethereum address');
    });
  });
});
