import { DomainError } from '../identity/auth.errors';

export type NotificationTypeEnum =
  | 'PROPOSAL_RECEIVED'
  | 'PROPOSAL_ACCEPTED'
  | 'DELIVERY_SUBMITTED'
  | 'MILESTONE_APPROVED'
  | 'MESSAGE_RECEIVED'
  | 'DISPUTE_OPENED';

export type NotificationChannelEnum = 'IN_APP' | 'EMAIL' | 'WEB_PUSH';

export function validateNotificationPayload(title: string, message: string): void {
  if (!title || title.trim().length === 0) {
    throw new DomainError('Notification title cannot be empty.', 'VALIDATION_FAILED', 400);
  }
  if (!message || message.trim().length === 0) {
    throw new DomainError('Notification message cannot be empty.', 'VALIDATION_FAILED', 400);
  }
}

export function isChannelEnabledForUser(
  preferences: Array<{
    type: NotificationTypeEnum;
    channel: NotificationChannelEnum;
    isEnabled: boolean;
  }>,
  type: NotificationTypeEnum,
  channel: NotificationChannelEnum,
): boolean {
  const pref = preferences.find((p) => p.type === type && p.channel === channel);
  return pref ? pref.isEnabled : true; // default to true if not explicitly disabled
}
