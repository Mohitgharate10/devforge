import { describe, it, expect } from 'vitest';
import {
  validateMessageContent,
  assertConversationMember,
  sanitizeMessageContent,
  InvalidMessageContentError,
} from './messaging.policy';
import { ForbiddenError } from '../identity/auth.errors';

describe('Messaging Policy', () => {
  describe('validateMessageContent', () => {
    it('validates and trims acceptable message content', () => {
      expect(validateMessageContent('  Hello contractor!  ')).toBe('Hello contractor!');
    });

    it('throws on empty or whitespace message', () => {
      expect(() => validateMessageContent('')).toThrow(InvalidMessageContentError);
      expect(() => validateMessageContent('    ')).toThrow(InvalidMessageContentError);
    });

    it('throws if message exceeds 4,000 characters', () => {
      const longMessage = 'a'.repeat(4001);
      expect(() => validateMessageContent(longMessage)).toThrow(InvalidMessageContentError);
    });
  });

  describe('assertConversationMember', () => {
    it('allows valid conversation members', () => {
      expect(() => assertConversationMember('u1', ['u1', 'u2'])).not.toThrow();
    });

    it('throws ForbiddenError for non-members', () => {
      expect(() => assertConversationMember('u3', ['u1', 'u2'])).toThrow(ForbiddenError);
    });
  });

  describe('sanitizeMessageContent', () => {
    it('strips script tags from message content', () => {
      const dirty = 'Hello <script>alert("xss")</script>world';
      expect(sanitizeMessageContent(dirty)).toBe('Hello world');
    });
  });
});
