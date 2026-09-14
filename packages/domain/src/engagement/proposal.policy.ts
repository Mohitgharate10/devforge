import { DomainError, ForbiddenError } from '../identity/auth.errors';

export class InvalidProposalTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Cannot transition proposal from state '${from}' to '${to}'.`,
      'STATE_TRANSITION_INVALID',
      422,
    );
    this.name = 'InvalidProposalTransitionError';
  }
}

export type ProposalStatusType = 'SUBMITTED' | 'WITHDRAWN' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

const VALID_PROPOSAL_TRANSITIONS: Record<ProposalStatusType, ProposalStatusType[]> = {
  SUBMITTED: ['WITHDRAWN', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
  WITHDRAWN: [],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};

export function canTransitionProposalStatus(
  current: ProposalStatusType,
  target: ProposalStatusType,
): boolean {
  return VALID_PROPOSAL_TRANSITIONS[current]?.includes(target) ?? false;
}

export function assertCanTransitionProposalStatus(
  current: ProposalStatusType,
  target: ProposalStatusType,
): void {
  if (!canTransitionProposalStatus(current, target)) {
    throw new InvalidProposalTransitionError(current, target);
  }
}

export function assertProposalSubmitter(actorUserId: string, freelancerUserId: string): void {
  if (actorUserId !== freelancerUserId) {
    throw new ForbiddenError('You can only modify or withdraw your own proposals.');
  }
}

export function assertJobClient(actorUserId: string, clientUserId: string): void {
  if (actorUserId !== clientUserId) {
    throw new ForbiddenError('Only the job owner can accept or reject proposals.');
  }
}

export function validateBidAmount(amount: bigint | number): void {
  const numericAmount = typeof amount === 'bigint' ? Number(amount) : amount;
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new DomainError('Bid amount must be a positive value.', 'VALIDATION_FAILED', 400);
  }
}

export function validateCoverLetter(coverLetter: string): void {
  if (!coverLetter || coverLetter.trim().length < 10) {
    throw new DomainError(
      'Cover letter must be at least 10 characters in length.',
      'VALIDATION_FAILED',
      400,
    );
  }
}
