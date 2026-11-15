import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { createDisputeRequestSchema } from '@devforge/api-contracts';
import type { ApiErrorCode } from '@devforge/api-contracts';
import { assertCanTransitionContractStatus, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

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
    const body = await request.json();
    const parsed = createDisputeRequestSchema.parse(body);

    try {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          clientProfile: true,
          freelancerProfile: true,
          participants: true,
        },
      });

      if (contract) {
        const isParty =
          contract.clientProfile?.userId === actor.userId ||
          contract.freelancerProfile?.userId === actor.userId ||
          contract.participants?.some(
            (p) => p.userId === actor.userId && (p.role === 'CLIENT' || p.role === 'FREELANCER'),
          );

        if (!isParty) {
          return failure(
            {
              code: 'FORBIDDEN',
              message: 'Only the contract client or freelancer can initiate a dispute.',
              status: 403,
            },
            requestId,
          );
        }

        assertCanTransitionContractStatus(contract.status, 'DISPUTED');

        const updated = await prisma.contract.update({
          where: { id: contractId },
          data: { status: 'DISPUTED' },
        });

        return success(
          {
            id: updated.id,
            status: updated.status,
            reason: parsed.reason,
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
          { code: 'INTERNAL_ERROR', message: 'Failed to open dispute.', status: 500 },
          requestId,
        );
      }
    }

    if (process.env.DEMO_MODE !== 'true') {
      return failure({ code: 'NOT_FOUND', message: 'Contract not found.', status: 404 }, requestId);
    }

    const demoContract = demoStore.getContracts().find((c) => c.id === contractId);
    if (!demoContract) {
      return failure({ code: 'NOT_FOUND', message: 'Contract not found.', status: 404 }, requestId);
    }

    const isDemoParty =
      demoContract.client?.userId === actor.userId ||
      demoContract.freelancer?.userId === actor.userId ||
      demoContract.participants?.some(
        (p: { userId: string; role: string }) =>
          p.userId === actor.userId && (p.role === 'CLIENT' || p.role === 'FREELANCER'),
      );

    if (!isDemoParty) {
      return failure(
        {
          code: 'FORBIDDEN',
          message: 'Only the contract client or freelancer can initiate a dispute.',
          status: 403,
        },
        requestId,
      );
    }

    const demo = demoStore.openDispute(contractId, parsed.reason);
    if (!demo) {
      return failure({ code: 'NOT_FOUND', message: 'Contract not found.', status: 404 }, requestId);
    }

    return success(
      {
        id: demo.id,
        status: demo.status,
        reason: parsed.reason,
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
      { code: 'INTERNAL_ERROR', message: 'Failed to initiate dispute.', status: 500 },
      requestId,
    );
  }
}
