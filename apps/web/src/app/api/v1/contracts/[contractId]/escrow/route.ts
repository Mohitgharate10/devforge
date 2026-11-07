import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { computeVaultKey } from '@devforge/domain';
import { depositEscrowRequestSchema } from '@devforge/api-contracts';
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { contractId } = await params;

  try {
    const body = await request.json();
    const parsed = depositEscrowRequestSchema.parse(body);
    const vaultKey = computeVaultKey(contractId, parsed.milestoneIndex);

    try {
      const numericAmount = parseFloat(parsed.amountEth);
      const amountBigInt = BigInt(Math.round(numericAmount * 1e18));

      const escrow = await prisma.escrow.create({
        data: {
          contractId,
          milestoneId: parsed.milestoneId,
          chainId: 11155111, // Sepolia
          contractAddress: '0x633C1B2dE8d4380E83141f2359489569777E4426',
          status: 'HELD',
          amount: amountBigInt,
          currency: 'ETH',
          funderAddress: parsed.clientAddress,
          recipientAddress: parsed.freelancerAddress,
          transactions: {
            create: {
              chainId: 11155111,
              txHash: parsed.txHash,
              fromAddress: parsed.clientAddress,
              toAddress: '0x633C1B2dE8d4380E83141f2359489569777E4426',
              action: 'DEPOSIT_MILESTONE',
              status: 'CONFIRMED',
            },
          },
        },
      });

      // Update milestone status to FUNDED
      await prisma.milestone.update({
        where: { id: parsed.milestoneId },
        data: { status: 'FUNDED' },
      });

      return success(
        {
          id: escrow.id,
          contractId: escrow.contractId,
          milestoneId: escrow.milestoneId,
          vaultKey,
          chainId: escrow.chainId,
          status: 'DEPOSITED',
          amount: parsed.amountEth,
          tokenSymbol: escrow.currency,
          clientAddress: escrow.funderAddress || parsed.clientAddress,
          freelancerAddress: escrow.recipientAddress || parsed.freelancerAddress,
          depositTxHash: parsed.txHash,
          releaseTxHash: null,
          createdAt: escrow.createdAt.toISOString(),
        },
        requestId,
      );
    } catch {
      // Fallback to memory demo store
      const demoRecord = demoStore.addOrUpdateEscrow({
        id: `escrow-${Date.now()}`,
        contractId,
        milestoneId: parsed.milestoneId,
        vaultKey,
        chainId: 11155111,
        status: 'DEPOSITED',
        amount: parsed.amountEth,
        tokenSymbol: 'ETH',
        clientAddress: parsed.clientAddress,
        freelancerAddress: parsed.freelancerAddress,
        depositTxHash: parsed.txHash,
        releaseTxHash: null,
        createdAt: new Date().toISOString(),
      });

      // Update contract milestone status in demo store
      const contract = demoStore.getContractById(contractId);
      if (contract) {
        const ms = contract.milestones.find((m) => m.id === parsed.milestoneId);
        if (ms) {
          ms.status = 'FUNDED';
        }
      }

      return success(demoRecord, requestId);
    }
  } catch (error) {
    return failure(
      {
        code: 'VALIDATION_FAILED',
        message: error instanceof Error ? error.message : 'Invalid escrow deposit request.',
        status: 400,
      },
      requestId,
    );
  }
}
