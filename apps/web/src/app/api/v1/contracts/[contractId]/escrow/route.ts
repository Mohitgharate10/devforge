import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { computeVaultKey, DomainError } from '@devforge/domain';
import type { ApiErrorCode } from '@devforge/api-contracts';
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
            message: 'You must be a client or freelancer on this contract to view escrow records.',
            status: 403,
          },
          requestId,
        );
      }
    } else {
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
            message: 'You must be a client or freelancer on this contract to view escrow records.',
            status: 403,
          },
          requestId,
        );
      }
    }

    try {
      const escrows = await prisma.escrow.findMany({
        where: { contractId },
        include: { transactions: true },
        orderBy: { createdAt: 'desc' },
      });

      if (escrows.length > 0) {
        return success(
          escrows.map((e) => {
            const tx = e.transactions[0];
            return {
              id: e.id,
              contractId: e.contractId,
              milestoneId: e.milestoneId,
              vaultKey: computeVaultKey(e.contractId, 0),
              chainId: e.chainId,
              status: e.status === 'HELD' ? 'DEPOSITED' : e.status,
              amount: (Number(e.amount) / 1e18).toString(),
              tokenSymbol: e.currency,
              clientAddress: e.funderAddress || '0x0000000000000000000000000000000000000000',
              freelancerAddress: e.recipientAddress || '0x0000000000000000000000000000000000000000',
              depositTxHash: tx?.txHash || null,
              releaseTxHash: null,
              createdAt: e.createdAt.toISOString(),
            };
          }),
          requestId,
        );
      }
    } catch {
      // Database offline - fallback to demo store
    }

    const demoEscrows = demoStore.getEscrowsByContractId(contractId);
    return success(demoEscrows, requestId);
  } catch {
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Failed to retrieve escrow records.', status: 500 },
      requestId,
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  return failure(
    {
      code: 'EXTERNAL_DEPENDENCY_FAILED',
      message: 'On-chain escrow funding is not configured. No funds or escrow record were created.',
      status: 503,
    },
    requestId,
  );
}
