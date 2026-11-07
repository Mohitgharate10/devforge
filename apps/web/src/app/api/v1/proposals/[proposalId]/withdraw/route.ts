import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import {
  assertCanTransitionProposalStatus,
  assertProposalSubmitter,
  DomainError,
} from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ proposalId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { proposalId } = await params;

  try {
    const actor = await optionalSession();

    try {
      if (actor) {
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
      }
    } catch {
      // Database offline - fallback to demo store
    }

    const demo = demoStore.getProposals().find((p) => p.id === proposalId);
    if (!demo) {
      return failure({ code: 'NOT_FOUND', message: 'Proposal not found.', status: 404 }, requestId);
    }

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
          code: error.code as 'STATE_TRANSITION_INVALID',
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
