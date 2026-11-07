import { describe, it, expect } from 'vitest';
import { validateNotificationPayload, isChannelEnabledForUser } from './notification.policy';
import { DomainError } from '../identity/auth.errors';

describe('Notification Policy', () => {
  it('validates title and message', () => {
    expect(() =>
      validateNotificationPayload('Milestone Approved', 'Your payout was released.'),
    ).not.toThrow();
    expect(() => validateNotificationPayload('', 'Message')).toThrow(DomainError);
    expect(() => validateNotificationPayload('Title', '')).toThrow(DomainError);
  });

  it('determines channel enablement', () => {
    const prefs = [
      { type: 'PROPOSAL_RECEIVED' as const, channel: 'EMAIL' as const, isEnabled: false },
      { type: 'PROPOSAL_RECEIVED' as const, channel: 'IN_APP' as const, isEnabled: true },
    ];

    expect(isChannelEnabledForUser(prefs, 'PROPOSAL_RECEIVED', 'EMAIL')).toBe(false);
    expect(isChannelEnabledForUser(prefs, 'PROPOSAL_RECEIVED', 'IN_APP')).toBe(true);
    // Defaults to true when no preference record
    expect(isChannelEnabledForUser(prefs, 'DISPUTE_OPENED', 'IN_APP')).toBe(true);
  });
});
