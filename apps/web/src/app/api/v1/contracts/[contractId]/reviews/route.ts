import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { createReviewRequestSchema } from '@devforge/api-contracts';
import type { ApiErrorCode } from '@devforge/api-contracts';
import { DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { contractId } = await params;

  let actor;
  try {
    actor = await requireSession(request.headers);
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as ApiErrorCode, message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'UNAUTHENTICATED', message: 'Authentication required.', status: 401 },
      requestId,
    );
  }

  try {
    let contract: {
      clientProfile?: { userId: string } | null;
      freelancerProfile?: { userId: string } | null;
      participants?: Array<{ userId: string; role: string }>;
    } | null = null;

    try {
      contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          clientProfile: true,
          freelancerProfile: true,
          participants: true,
        },
      });
    } catch {
      // Database offline - fallback to demo store
    }

    if (contract) {
      const isClientOrFreelancer =
        contract.clientProfile?.userId === actor.userId ||
        contract.freelancerProfile?.userId === actor.userId ||
        (contract.participants?.some(
          (p) => p.userId === actor.userId && (p.role === 'CLIENT' || p.role === 'FREELANCER'),
        ) ??
          false);

      if (!isClientOrFreelancer) {
        return failure(
          {
            code: 'FORBIDDEN',
            message: 'You must be a client or freelancer on this contract to view reviews.',
            status: 403,
          },
          requestId,
        );
      }
    } else {
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          { code: 'NOT_FOUND', message: 'Contract not found.', status: 404 },
          requestId,
        );
      }

      const demoContract = demoStore.getContractById(contractId);
      if (!demoContract) {
        return failure(
          { code: 'NOT_FOUND', message: 'Contract not found.', status: 404 },
          requestId,
        );
      }

      const isClientOrFreelancer =
        demoContract.client.userId === actor.userId ||
        demoContract.freelancer.userId === actor.userId ||
        demoContract.participants.some(
          (p) => p.userId === actor.userId && (p.role === 'CLIENT' || p.role === 'FREELANCER'),
        );

      if (!isClientOrFreelancer) {
        return failure(
          {
            code: 'FORBIDDEN',
            message: 'You must be a client or freelancer on this contract to view reviews.',
            status: 403,
          },
          requestId,
        );
      }
    }

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
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          { code: 'INTERNAL_ERROR', message: 'Failed to retrieve reviews.', status: 500 },
          requestId,
        );
      }
    }

    if (process.env.DEMO_MODE !== 'true') {
      return success([], requestId);
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

  let actor;
  try {
    actor = await requireSession(request.headers);
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as ApiErrorCode, message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'UNAUTHENTICATED', message: 'Authentication required.', status: 401 },
      requestId,
    );
  }

  try {
    let contract: {
      clientProfile?: { userId: string } | null;
      freelancerProfile?: { userId: string } | null;
      participants?: Array<{ userId: string; role: string }>;
    } | null = null;

    try {
      contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          clientProfile: true,
          freelancerProfile: true,
          participants: true,
        },
      });
    } catch {
      // Database offline
    }

    let defaultTargetId = '00000000-0000-4000-8000-000000000002';
    let authorName = 'Reviewer';

    if (contract) {
      const isClientOrFreelancer =
        contract.clientProfile?.userId === actor.userId ||
        contract.freelancerProfile?.userId === actor.userId ||
        (contract.participants?.some(
          (p) => p.userId === actor.userId && (p.role === 'CLIENT' || p.role === 'FREELANCER'),
        ) ??
          false);

      if (!isClientOrFreelancer) {
        return failure(
          {
            code: 'FORBIDDEN',
            message: 'You must be a client or freelancer on this contract to submit a review.',
            status: 403,
          },
          requestId,
        );
      }

      defaultTargetId =
        contract.clientProfile?.userId === actor.userId
          ? contract.freelancerProfile?.userId || defaultTargetId
          : contract.clientProfile?.userId || defaultTargetId;
    } else {
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          { code: 'NOT_FOUND', message: 'Contract not found.', status: 404 },
          requestId,
        );
      }

      const demoContract = demoStore.getContractById(contractId);
      if (!demoContract) {
        return failure(
          { code: 'NOT_FOUND', message: 'Contract not found.', status: 404 },
          requestId,
        );
      }

      const isClientOrFreelancer =
        demoContract.client.userId === actor.userId ||
        demoContract.freelancer.userId === actor.userId ||
        demoContract.participants.some(
          (p) => p.userId === actor.userId && (p.role === 'CLIENT' || p.role === 'FREELANCER'),
        );

      if (!isClientOrFreelancer) {
        return failure(
          {
            code: 'FORBIDDEN',
            message: 'You must be a client or freelancer on this contract to submit a review.',
            status: 403,
          },
          requestId,
        );
      }

      defaultTargetId =
        demoContract.client.userId === actor.userId
          ? demoContract.freelancer.userId
          : demoContract.client.userId;
      authorName =
        demoContract.client.userId === actor.userId
          ? demoContract.client.organizationName
          : demoContract.freelancer.displayName;
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = createReviewRequestSchema.safeParse(body);

    const authorId = actor.userId;

    let rating: number;
    let feedback: string;
    let targetId: string;
    let qualityRating: number | undefined;
    let communicationRating: number | undefined;
    let deadlineRating: number | undefined;

    if (parsed.success) {
      rating = parsed.data.rating;
      feedback = parsed.data.feedback;
      targetId = parsed.data.targetId;
      qualityRating = parsed.data.qualityRating;
      communicationRating = parsed.data.communicationRating;
      deadlineRating = parsed.data.deadlineRating;
    } else {
      rating = typeof body?.rating === 'number' ? Math.round(body.rating) : 5;
      feedback = typeof body?.feedback === 'string' ? body.feedback.trim() : '';
      targetId =
        typeof body?.targetId === 'string' && body.targetId.trim().length > 0
          ? body.targetId.trim()
          : defaultTargetId;
      qualityRating = typeof body?.qualityRating === 'number' ? body.qualityRating : undefined;
      communicationRating =
        typeof body?.communicationRating === 'number' ? body.communicationRating : undefined;
      deadlineRating = typeof body?.deadlineRating === 'number' ? body.deadlineRating : undefined;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'Rating must be an integer between 1 and 5.',
          status: 400,
        },
        requestId,
      );
    }

    if (!feedback || feedback.length < 5) {
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
          rating,
          comment: feedback,
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
          qualityRating: qualityRating ?? review.rating,
          communicationRating: communicationRating ?? review.rating,
          deadlineRating: deadlineRating ?? review.rating,
          isRevealed: true,
          createdAt: review.createdAt.toISOString(),
        },
        requestId,
      );
    } catch {
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          { code: 'INTERNAL_ERROR', message: 'Failed to create review in database.', status: 500 },
          requestId,
        );
      }
      const demoRev = demoStore.addReview({
        id: `rev-${Date.now()}`,
        contractId,
        authorId,
        authorName,
        targetId,
        rating,
        feedback,
        qualityRating: qualityRating ?? rating,
        communicationRating: communicationRating ?? rating,
        deadlineRating: deadlineRating ?? rating,
        isRevealed: true,
        createdAt: new Date().toISOString(),
      });

      return success(demoRev, requestId);
    }
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        {
          code: error.code as ApiErrorCode,
          message: error.message,
          status: error.statusCode,
        },
        requestId,
      );
    }
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
