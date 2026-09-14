import { DomainError, ForbiddenError } from '../identity/auth.errors';

export class InvalidMessageContentError extends DomainError {
  constructor(reason: string) {
    super(reason, 'VALIDATION_FAILED', 400);
    this.name = 'InvalidMessageContentError';
  }
}

export function validateMessageContent(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    throw new InvalidMessageContentError('Message content cannot be empty.');
  }
  if (trimmed.length > 4000) {
    throw new InvalidMessageContentError('Message content cannot exceed 4,000 characters.');
  }
  return trimmed;
}

export function assertConversationMember(
  actorUserId: string,
  memberUserIds: string[],
): void {
  if (!memberUserIds.includes(actorUserId)) {
    throw new ForbiddenError('You are not an authorized participant in this conversation.');
  }
}

export function sanitizeMessageContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}
