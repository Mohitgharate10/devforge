import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { rejectProposalRequestSchema } from '@devforge/api-contracts';
import { assertCanTransitionProposalStatus, assertJobClient, DomainError } from '@devforge/domain';
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
    let reason: string | undefined;
    try {
      const body = await request.json();
      const parsed = rejectProposalRequestSchema.parse(body);
      reason = parsed.reason;
    } catch {
      // Body is optional
    }

    const actor = await optionalSession();

    try {
      if (actor) {
        const proposal = await prisma.proposal.findUnique({
          where: { id: proposalId },
          include: {
            job: {
              include: { clientProfile: true },
            },
          },
        });

        if (proposal) {
          assertJobClient(actor.userId, proposal.job.clientProfile.userId);
          assertCanTransitionProposalStatus(proposal.status, 'REJECTED');

          const updated = await prisma.proposal.update({
            where: { id: proposalId },
            data: {
              status: 'REJECTED',
              statusHistory: {
                create: {
                  fromStatus: proposal.status,
                  toStatus: 'REJECTED',
                  actorId: actor.userId,
                  reason: reason ?? 'Client rejected proposal',
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

    assertCanTransitionProposalStatus(demo.status, 'REJECTED');
    demoStore.updateProposalStatus(proposalId, 'REJECTED');

    return success(
      {
        id: demo.id,
        status: 'REJECTED',
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
      { code: 'INTERNAL_ERROR', message: 'Failed to reject proposal.', status: 500 },
      requestId,
    );
  }
}
