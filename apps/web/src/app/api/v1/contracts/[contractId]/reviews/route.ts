import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { createReviewRequestSchema } from '@devforge/api-contracts';
import { success, failure } from '@/server/shared/http/api-response';
import { demoStore } from '@/server/engagement/demo-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { contractId } = await params;

  try {
    try {
      const reviews = await prisma.review.findMany({
        where: { contractId },
        include: { reviewer: true },
        orderBy: { createdAt: 'desc' },
      });

      if (reviews.length > 0) {
        return success(
          reviews.map((r) => ({
            id: r.id,
            contractId: r.contractId,
            authorId: r.reviewerId,
            authorName: r.reviewer.displayName,
            targetId: r.revieweeId,
            rating: r.rating,
            feedback: r.comment || '',
            qualityRating: r.rating,
            communicationRating: r.rating,
            deadlineRating: r.rating,
            isRevealed: true,
            createdAt: r.createdAt.toISOString(),
          })),
          requestId,
        );
      }
    } catch {
      // Database offline - fallback to demo store
    }

    const demoReviews = demoStore.getReviews(contractId);
    return success(demoReviews, requestId);
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to retrieve reviews.', status: 500 },
      requestId,
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { contractId } = await params;

  try {
    const body = await request.json();
    const parsed = createReviewRequestSchema.parse(body);

    const contract = demoStore.getContractById(contractId);
    const clientId = contract ? contract.client.userId : 'user-parity';
    const freelancerId = contract ? contract.freelancer.userId : 'user-elena';
    const authorId = request.headers.get('x-user-id') || clientId;
    const authorName =
      request.headers.get('x-user-name') ||
      (contract ? contract.client.organizationName : 'Client Reviewer');
    const targetId = parsed.targetId || freelancerId;

    if (!Number.isInteger(parsed.rating) || parsed.rating < 1 || parsed.rating > 5) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'Rating must be an integer between 1 and 5.',
          status: 400,
        },
        requestId,
      );
    }

    if (!parsed.feedback || parsed.feedback.trim().length < 5) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'Feedback must be at least 5 characters long.',
          status: 400,
        },
        requestId,
      );
    }

    try {
      const review = await prisma.review.create({
        data: {
          contractId,
          reviewerId: authorId,
          revieweeId: targetId,
          rating: parsed.rating,
          comment: parsed.feedback,
        },
        include: { reviewer: true },
      });

      return success(
        {
          id: review.id,
          contractId: review.contractId,
          authorId: review.reviewerId,
          authorName: review.reviewer.displayName,
          targetId: review.revieweeId,
          rating: review.rating,
          feedback: review.comment || '',
          qualityRating: parsed.qualityRating ?? review.rating,
          communicationRating: parsed.communicationRating ?? review.rating,
          deadlineRating: parsed.deadlineRating ?? review.rating,
          isRevealed: true,
          createdAt: review.createdAt.toISOString(),
        },
        requestId,
      );
    } catch {
      const demoRev = demoStore.addReview({
        id: `rev-${Date.now()}`,
        contractId,
        authorId,
        authorName,
        targetId,
        rating: parsed.rating,
        feedback: parsed.feedback,
        qualityRating: parsed.qualityRating ?? parsed.rating,
        communicationRating: parsed.communicationRating ?? parsed.rating,
        deadlineRating: parsed.deadlineRating ?? parsed.rating,
        isRevealed: true,
        createdAt: new Date().toISOString(),
      });

      return success(demoRev, requestId);
    }
  } catch (error) {
    return failure(
      {
        code: 'VALIDATION_FAILED',
        message: error instanceof Error ? error.message : 'Invalid review submission.',
        status: 400,
      },
      requestId,
    );
  }
}
