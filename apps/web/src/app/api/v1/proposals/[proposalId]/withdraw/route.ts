import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import {
  assertCanTransitionProposalStatus,
  assertProposalSubmitter,
  DomainError,
} from '@devforge/domain';
import type { ApiErrorCode } from '@devforge/api-contracts';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ proposalId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { proposalId } = await params;

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
    try {
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        include: { freelancerProfile: true },
      });

      if (proposal) {
        assertProposalSubmitter(actor.userId, proposal.freelancerProfile.userId);
        assertCanTransitionProposalStatus(proposal.status, 'WITHDRAWN');

        const updated = await prisma.proposal.update({
          where: { id: proposalId },
          data: {
            status: 'WITHDRAWN',
            statusHistory: {
              create: {
                fromStatus: proposal.status,
                toStatus: 'WITHDRAWN',
                actorId: actor.userId,
                reason: 'Freelancer withdrew proposal',
              },
            },
          },
        });

        return success(
          {
            id: updated.id,
            status: updated.status,
            updatedAt: updated.updatedAt.toISOString(),
            isLocalDemo: false,
          },
          requestId,
        );
      }
    } catch (dbErr) {
      if (dbErr instanceof DomainError) {
        throw dbErr;
      }
      // Database offline - fallback to demo store
      if (process.env.DEMO_MODE !== 'true') {
        return failure(
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to withdraw proposal in database.',
            status: 500,
          },
          requestId,
        );
      }
    }

    if (process.env.DEMO_MODE !== 'true') {
      return failure({ code: 'NOT_FOUND', message: 'Proposal not found.', status: 404 }, requestId);
    }

    const demo = demoStore.getProposals().find((p) => p.id === proposalId);
    if (!demo) {
      return failure({ code: 'NOT_FOUND', message: 'Proposal not found.', status: 404 }, requestId);
    }

    assertProposalSubmitter(actor.userId, demo.freelancer.userId);
    assertCanTransitionProposalStatus(demo.status, 'WITHDRAWN');
    demoStore.updateProposalStatus(proposalId, 'WITHDRAWN');

    return success(
      {
        id: demo.id,
        status: 'WITHDRAWN',
        updatedAt: demo.updatedAt,
        isLocalDemo: true,
      },
      requestId,
    );
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
      { code: 'INTERNAL_ERROR', message: 'Failed to withdraw proposal.', status: 500 },
      requestId,
    );
  }
}
