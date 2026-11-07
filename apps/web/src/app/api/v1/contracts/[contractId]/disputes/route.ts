import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { createDisputeRequestSchema } from '@devforge/api-contracts';
import { assertCanTransitionContractStatus, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { demoStore } from '@/server/engagement/demo-data';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { contractId } = await params;

  try {
    const body = await request.json();
    const parsed = createDisputeRequestSchema.parse(body);

    const actor = await optionalSession();

    try {
      if (actor) {
        const contract = await prisma.contract.findUnique({
          where: { id: contractId },
        });

        if (!contract) {
          return failure(
            { code: 'NOT_FOUND', message: 'Contract not found.', status: 404 },
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
    } catch {
      // Database offline - fallback to demo store
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
          code: error.code as 'STATE_TRANSITION_INVALID',
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
