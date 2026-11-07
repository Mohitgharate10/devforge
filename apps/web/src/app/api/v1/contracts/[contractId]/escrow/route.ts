import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { computeVaultKey } from '@devforge/domain';
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
