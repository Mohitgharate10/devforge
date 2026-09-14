import { describe, it, expect } from 'vitest';
import {
  validateReviewSubmission,
  isReviewRevealed,
  canTransitionReportStatus,
} from './review.policy';

describe('review.policy', () => {
  describe('validateReviewSubmission', () => {
    const validBase = {
      contractId: 'c1',
      contractStatus: 'COMPLETED',
      authorId: 'client-1',
      targetId: 'freelancer-1',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
      rating: 5,
      feedback: 'Excellent work delivered on time with high code quality.',
    };

    it('accepts valid review submissions', () => {
      expect(() => validateReviewSubmission(validBase)).not.toThrow();
    });

    it('rejects submission for non-completed contracts', () => {
      expect(() =>
        validateReviewSubmission({
          ...validBase,
          contractStatus: 'ACTIVE',
        }),
      ).toThrow('Reviews can only be submitted for completed contracts');
    });

    it('rejects review for self', () => {
      expect(() =>
        validateReviewSubmission({
          ...validBase,
          targetId: 'client-1',
        }),
      ).toThrow('Cannot submit a review for yourself');
    });

    it('rejects unauthorized author', () => {
      expect(() =>
        validateReviewSubmission({
          ...validBase,
          authorId: 'third-party',
        }),
      ).toThrow('Only the client or freelancer on this contract can submit a review');
    });

    it('rejects invalid rating range or short feedback', () => {
      expect(() =>
        validateReviewSubmission({
          ...validBase,
          rating: 6,
        }),
      ).toThrow('Rating must be an integer between 1 and 5');

      expect(() =>
        validateReviewSubmission({
          ...validBase,
          feedback: 'Too short',
        }),
      ).toThrow('Feedback must be at least 10 characters long');
    });
  });

  describe('isReviewRevealed', () => {
    const now = new Date('2026-09-14T00:00:00Z');
    const completedRecently = new Date('2026-09-10T00:00:00Z'); // 4 days ago
    const completedLongAgo = new Date('2026-08-01T00:00:00Z'); // 44 days ago

    it('reveals immediately if both parties reviewed', () => {
      expect(
        isReviewRevealed({
          hasClientReviewed: true,
          hasFreelancerReviewed: true,
          contractCompletedAt: completedRecently,
          now,
        }),
      ).toBe(true);
    });

    it('hides if only one party reviewed before 14-day window expires', () => {
      expect(
        isReviewRevealed({
          hasClientReviewed: true,
          hasFreelancerReviewed: false,
          contractCompletedAt: completedRecently,
          now,
        }),
      ).toBe(false);
    });

    it('reveals even if only one party reviewed after 14-day window expires', () => {
      expect(
        isReviewRevealed({
          hasClientReviewed: true,
          hasFreelancerReviewed: false,
          contractCompletedAt: completedLongAgo,
          now,
        }),
      ).toBe(true);
    });
  });

  describe('canTransitionReportStatus', () => {
    it('allows valid report status progressions', () => {
      expect(canTransitionReportStatus('PENDING', 'INVESTIGATING')).toBe(true);
      expect(canTransitionReportStatus('PENDING', 'RESOLVED')).toBe(true);
      expect(canTransitionReportStatus('INVESTIGATING', 'RESOLVED')).toBe(true);
      expect(canTransitionReportStatus('RESOLVED', 'PENDING')).toBe(false);
    });
  });
});
