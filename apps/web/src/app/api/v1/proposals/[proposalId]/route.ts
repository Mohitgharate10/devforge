import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { updateProposalRequestSchema } from '@devforge/api-contracts';
import {
  validateCoverLetter,
  validateBidAmount,
  assertProposalSubmitter,
  DomainError,
} from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ proposalId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { proposalId } = await params;

  try {
    try {
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        include: {
          job: true,
          freelancerProfile: {
            include: { user: true },
          },
        },
      });

      if (proposal) {
        return success(
          {
            id: proposal.id,
            jobId: proposal.jobId,
            jobTitle: proposal.job.title,
            freelancerProfileId: proposal.freelancerProfileId,
            freelancer: {
              id: proposal.freelancerProfile.id,
              displayName: proposal.freelancerProfile.user.displayName,
              handle: proposal.freelancerProfile.handle,
              title: proposal.freelancerProfile.title,
              avatarUrl: proposal.freelancerProfile.user.avatarUrl,
            },
            coverLetter: proposal.coverLetter,
            bidAmount: Number(proposal.bidAmount),
            currency: proposal.currency,
            status: proposal.status,
            createdAt: proposal.createdAt.toISOString(),
            updatedAt: proposal.updatedAt.toISOString(),
            isLocalDemo: false,
          },
          requestId,
        );
      }
    } catch {
      // Database offline - fallback to demo store
    }

    const demo = demoStore.getProposals().find((p) => p.id === proposalId);
    if (!demo) {
      return failure(
        { code: 'NOT_FOUND', message: 'Proposal not found.', status: 404 },
        requestId,
      );
    }

    return success(
      {
        id: demo.id,
        jobId: demo.jobId,
        jobTitle: demo.jobTitle,
        freelancerProfileId: demo.freelancerProfileId,
        freelancer: demo.freelancer,
        coverLetter: demo.coverLetter,
        bidAmount: demo.bidAmount,
        currency: demo.currency,
        status: demo.status,
        createdAt: demo.createdAt,
        updatedAt: demo.updatedAt,
        isLocalDemo: true,
      },
      requestId,
    );
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to retrieve proposal.', status: 500 },
      requestId,
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ proposalId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { proposalId } = await params;

  try {
    const body = await request.json();
    const parsed = updateProposalRequestSchema.parse(body);

    if (parsed.coverLetter !== undefined) {
      validateCoverLetter(parsed.coverLetter);
    }
    if (parsed.bidAmount !== undefined) {
      validateBidAmount(parsed.bidAmount);
    }

    const actor = await optionalSession();

    try {
      if (actor) {
        const existing = await prisma.proposal.findUnique({
          where: { id: proposalId },
          include: { freelancerProfile: true },
        });

        if (!existing) {
          return failure(
            { code: 'NOT_FOUND', message: 'Proposal not found.', status: 404 },
            requestId,
          );
        }

        assertProposalSubmitter(actor.userId, existing.freelancerProfile.userId);

        if (existing.status !== 'SUBMITTED') {
          return failure(
            {
              code: 'STATE_TRANSITION_INVALID',
              message: `Cannot edit proposal with status '${existing.status}'.`,
              status: 422,
            },
            requestId,
          );
        }

        const updated = await prisma.proposal.update({
          where: { id: proposalId },
          data: {
            ...(parsed.coverLetter !== undefined ? { coverLetter: parsed.coverLetter } : {}),
            ...(parsed.bidAmount !== undefined ? { bidAmount: BigInt(parsed.bidAmount) } : {}),
          },
          include: {
            job: true,
            freelancerProfile: {
              include: { user: true },
            },
          },
        });

        return success(
          {
            id: updated.id,
            jobId: updated.jobId,
            jobTitle: updated.job.title,
            freelancerProfileId: updated.freelancerProfileId,
            coverLetter: updated.coverLetter,
            bidAmount: Number(updated.bidAmount),
            currency: updated.currency,
            status: updated.status,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
            isLocalDemo: false,
          },
          requestId,
        );
      }
    } catch {
      // Database offline - fallback to demo store
    }

    const demo = demoStore.getProposals().find((p) => p.id === proposalId);
    if (!demo) {
      return failure(
        { code: 'NOT_FOUND', message: 'Proposal not found.', status: 404 },
        requestId,
      );
    }

    if (parsed.coverLetter !== undefined) demo.coverLetter = parsed.coverLetter;
    if (parsed.bidAmount !== undefined) demo.bidAmount = parsed.bidAmount;
    demo.updatedAt = new Date().toISOString();

    return success(
      {
        id: demo.id,
        jobId: demo.jobId,
        jobTitle: demo.jobTitle,
        freelancerProfileId: demo.freelancerProfileId,
        coverLetter: demo.coverLetter,
        bidAmount: demo.bidAmount,
        currency: demo.currency,
        status: demo.status,
        createdAt: demo.createdAt,
        updatedAt: demo.updatedAt,
        isLocalDemo: true,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'VALIDATION_FAILED', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to update proposal.', status: 500 },
      requestId,
    );
  }
}
