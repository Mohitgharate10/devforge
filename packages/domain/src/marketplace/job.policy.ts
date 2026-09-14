import { DomainError, ForbiddenError } from '../identity/auth.errors';

export class InvalidStateTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Cannot transition job from state '${from}' to '${to}'.`,
      'STATE_TRANSITION_INVALID',
      422,
    );
    this.name = 'InvalidStateTransitionError';
  }
}

export type JobStatusType = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED' | 'ARCHIVED';

const VALID_JOB_TRANSITIONS: Record<JobStatusType, JobStatusType[]> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['PAUSED', 'CLOSED', 'ARCHIVED'],
  PAUSED: ['PUBLISHED', 'CLOSED', 'ARCHIVED'],
  CLOSED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function canTransitionJobStatus(current: JobStatusType, target: JobStatusType): boolean {
  return VALID_JOB_TRANSITIONS[current]?.includes(target) ?? false;
}

export function assertCanTransitionJobStatus(current: JobStatusType, target: JobStatusType): void {
  if (!canTransitionJobStatus(current, target)) {
    throw new InvalidStateTransitionError(current, target);
  }
}

export function assertJobOwnership(actorUserId: string, clientOwnerUserId: string): void {
  if (actorUserId !== clientOwnerUserId) {
    throw new ForbiddenError('You can only modify your own job listings.');
  }
}

export function assertJobCanAcceptProposals(status: JobStatusType): void {
  if (status !== 'PUBLISHED') {
    throw new DomainError(
      `Cannot submit proposals to a job that is in status '${status}'. Only 'PUBLISHED' jobs accept proposals.`,
      'STATE_TRANSITION_INVALID',
      422,
    );
  }
}
