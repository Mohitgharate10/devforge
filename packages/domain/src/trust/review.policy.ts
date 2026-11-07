import { DomainError, ForbiddenError } from '../identity/auth.errors';

export type ReportStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
export type ReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ReviewSubmissionInput {
  contractId: string;
  contractStatus: string;
  authorId: string;
  targetId: string;
  clientId: string;
  freelancerId: string;
  rating: number; // 1 - 5
  feedback: string;
  qualityRating?: number;
  communicationRating?: number;
  deadlineRating?: number;
}

export function validateReviewSubmission(input: ReviewSubmissionInput): void {
  if (input.contractStatus !== 'COMPLETED') {
    throw new DomainError(
      'Reviews can only be submitted for completed contracts',
      'STATE_TRANSITION_INVALID',
      400,
    );
  }

  const isClient = input.authorId === input.clientId;
  const isFreelancer = input.authorId === input.freelancerId;

  if (!isClient && !isFreelancer) {
    throw new ForbiddenError('Only the client or freelancer on this contract can submit a review');
  }

  if (input.authorId === input.targetId) {
    throw new DomainError('Cannot submit a review for yourself', 'VALIDATION_FAILED', 400);
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new DomainError('Rating must be an integer between 1 and 5', 'VALIDATION_FAILED', 400);
  }

  if (!input.feedback || input.feedback.trim().length < 10) {
    throw new DomainError('Feedback must be at least 10 characters long', 'VALIDATION_FAILED', 400);
  }

  const optionalRatings = [input.qualityRating, input.communicationRating, input.deadlineRating];
  for (const subRating of optionalRatings) {
    if (
      subRating !== undefined &&
      (!Number.isInteger(subRating) || subRating < 1 || subRating > 5)
    ) {
      throw new DomainError(
        'Sub-ratings must be integers between 1 and 5',
        'VALIDATION_FAILED',
        400,
      );
    }
  }
}

/**
 * Double-blind review visibility rule:
 * Reviews become visible if both parties submitted, or if the 14-day window has expired.
 */
export function isReviewRevealed(params: {
  hasClientReviewed: boolean;
  hasFreelancerReviewed: boolean;
  contractCompletedAt: Date;
  now?: Date;
}): boolean {
  if (params.hasClientReviewed && params.hasFreelancerReviewed) {
    return true;
  }
  const currentTime = params.now ?? new Date();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  return currentTime.getTime() - params.contractCompletedAt.getTime() > fourteenDaysMs;
}

const VALID_REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  PENDING: ['INVESTIGATING', 'DISMISSED', 'RESOLVED'],
  INVESTIGATING: ['RESOLVED', 'DISMISSED'],
  RESOLVED: [],
  DISMISSED: [],
};

export function canTransitionReportStatus(current: ReportStatus, target: ReportStatus): boolean {
  return VALID_REPORT_TRANSITIONS[current]?.includes(target) ?? false;
}

export function assertValidReportTransition(current: ReportStatus, target: ReportStatus): void {
  if (!canTransitionReportStatus(current, target)) {
    throw new DomainError(
      `Invalid report state transition from ${current} to ${target}`,
      'STATE_TRANSITION_INVALID',
      400,
    );
  }
}
