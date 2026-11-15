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

  // Parse and strictly validate request body schema — no lenient fallback with default values
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure(
      { code: 'VALIDATION_FAILED', message: 'Invalid JSON request body.', status: 400 },
      requestId,
    );
  }

  const parsed = createReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure(
      {
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Invalid review submission.',
        status: 400,
      },
      requestId,
    );
  }

  const { rating, feedback, qualityRating, communicationRating, deadlineRating } = parsed.data;

  try {
    let contract: {
      id: string;
      status: string;
      clientProfile?: { userId: string } | null;
      freelancerProfile?: { userId: string } | null;
      participants?: Array<{ userId: string; role: string }>;
    } | null = null;

    try {
      contract = await prisma.contract.findUnique({
        where: { id: contractId },
        select: {
          id: true,
          status: true,
          clientProfile: { select: { userId: true } },
          freelancerProfile: { select: { userId: true } },
          participants: { select: { userId: true, role: true } },
        },
      });
    } catch {
      // Database offline - fallback to demo store in demo mode
    }

    let targetId: string;
    let authorName = 'Reviewer';
    const authorId = actor.userId;

    if (contract) {
      const clientId =
        contract.clientProfile?.userId ??
        contract.participants?.find((p) => p.role === 'CLIENT')?.userId;
      const freelancerId =
        contract.freelancerProfile?.userId ??
        contract.participants?.find((p) => p.role === 'FREELANCER')?.userId;

      const isClient = authorId === clientId;
      const isFreelancer = authorId === freelancerId;

      if (!isClient && !isFreelancer) {
        return failure(
          {
            code: 'FORBIDDEN',
            message: 'You must be a client or freelancer on this contract to submit a review.',
            status: 403,
          },
          requestId,
        );
      }

      // Reviews can only be submitted once the contract is completed
      if (contract.status !== 'COMPLETED') {
        return failure(
          {
            code: 'STATE_TRANSITION_INVALID',
            message: 'Reviews can only be submitted for completed contracts.',
            status: 400,
          },
          requestId,
        );
      }

      // Derive reviewee server-side as the counterparty on the contract
      const counterpartyId = isClient ? freelancerId : clientId;
      if (!counterpartyId) {
        return failure(
          {
            code: 'INTERNAL_ERROR',
            message: 'Unable to resolve contract counterparty for review.',
            status: 500,
          },
          requestId,
        );
      }
      targetId = counterpartyId;
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

      const clientId = demoContract.client.userId;
      const freelancerId = demoContract.freelancer.userId;
      const isClient = authorId === clientId;
      const isFreelancer = authorId === freelancerId;

      if (!isClient && !isFreelancer) {
        return failure(
          {
            code: 'FORBIDDEN',
            message: 'You must be a client or freelancer on this contract to submit a review.',
            status: 403,
          },
          requestId,
        );
      }

      // Reviews can only be submitted once the contract is completed
      if (demoContract.status !== 'COMPLETED') {
        return failure(
          {
            code: 'STATE_TRANSITION_INVALID',
            message: 'Reviews can only be submitted for completed contracts.',
            status: 400,
          },
          requestId,
        );
      }

      targetId = isClient ? freelancerId : clientId;
      authorName = isClient
        ? demoContract.client.organizationName
        : demoContract.freelancer.displayName;
    }

    try {
      // Check duplicate review constraint in database
      const existingReview = await prisma.review.findFirst({
        where: {
          contractId,
          reviewerId: authorId,
        },
      });

      if (existingReview) {
        return failure(
          {
            code: 'CONFLICT',
            message: 'You have already submitted a review for this contract.',
            status: 409,
          },
          requestId,
        );
      }

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
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        return failure(
          {
            code: 'CONFLICT',
            message: 'You have already submitted a review for this contract.',
            status: 409,
          },
          requestId,
        );
      }

      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          { code: 'INTERNAL_ERROR', message: 'Failed to create review in database.', status: 500 },
          requestId,
        );
      }

      // Check duplicate review constraint in demo store
      const existingDemoReviews = demoStore.getReviews(contractId);
      if (existingDemoReviews.some((r) => r.authorId === authorId)) {
        return failure(
          {
            code: 'CONFLICT',
            message: 'You have already submitted a review for this contract.',
            status: 409,
          },
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
