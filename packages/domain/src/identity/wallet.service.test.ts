import { describe, it, expect } from 'vitest';
import {
  generateNonce,
  getNonceExpiresAt,
  buildSiweMessage,
  normalizeAddress,
  isNonceExpired,
  isNonceUsed,
} from './wallet.service.js';

describe('wallet.service', () => {
  describe('generateNonce', () => {
    it('generates a 64-character hexadecimal nonce', () => {
      const nonce = generateNonce();
      expect(nonce).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(nonce)).toBe(true);
    });

    it('generates unique nonces on each call', () => {
      const n1 = generateNonce();
      const n2 = generateNonce();
      expect(n1).not.toEqual(n2);
    });
  });

  describe('getNonceExpiresAt', () => {
    it('returns a future date within approximately 15 minutes', () => {
      const now = Date.now();
      const expires = getNonceExpiresAt();
      const diffMinutes = (expires.getTime() - now) / (1000 * 60);
      expect(diffMinutes).toBeGreaterThan(14.9);
      expect(diffMinutes).toBeLessThanOrEqual(15.1);
    });
  });

  describe('normalizeAddress', () => {
    it('lowercases ethereum addresses', () => {
      expect(normalizeAddress('0xAbCdEf1234567890abcdef1234567890ABCDEF12')).toBe(
        '0xabcdef1234567890abcdef1234567890abcdef12',
      );
    });
  });

  describe('isNonceExpired', () => {
    it('returns false for future date', () => {
      const future = new Date(Date.now() + 100000);
      expect(isNonceExpired(future)).toBe(false);
    });

    it('returns true for past date', () => {
      const past = new Date(Date.now() - 100000);
      expect(isNonceExpired(past)).toBe(true);
    });
  });

  describe('isNonceUsed', () => {
    it('returns false if usedAt is null', () => {
      expect(isNonceUsed(null)).toBe(false);
    });

    it('returns true if usedAt is a Date', () => {
      expect(isNonceUsed(new Date())).toBe(true);
    });
  });

  describe('buildSiweMessage', () => {
    it('builds an EIP-4361 compliant message format', () => {
      const msg = buildSiweMessage({
        domain: 'localhost:3000',
        address: '0x1234567890123456789012345678901234567890',
        statement: 'Sign in to DevForge.',
        uri: 'http://localhost:3000',
        version: '1',
        chainId: 1,
        nonce: 'abc123nonce',
        issuedAt: '2026-09-05T00:00:00.000Z',
        expirationTime: '2026-09-05T00:15:00.000Z',
      });

      expect(msg).toContain('localhost:3000 wants you to sign in with your Ethereum account:');
      expect(msg).toContain('0x1234567890123456789012345678901234567890');
      expect(msg).toContain('Sign in to DevForge.');
      expect(msg).toContain('URI: http://localhost:3000');
      expect(msg).toContain('Version: 1');
      expect(msg).toContain('Chain ID: 1');
      expect(msg).toContain('Nonce: abc123nonce');
      expect(msg).toContain('Issued At: 2026-09-05T00:00:00.000Z');
      expect(msg).toContain('Expiration Time: 2026-09-05T00:15:00.000Z');
    });
  });
});
