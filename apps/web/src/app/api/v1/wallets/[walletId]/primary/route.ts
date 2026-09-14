import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { DomainError, NotFoundError, ForbiddenError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ walletId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { walletId } = await params;

  try {
    const actor = await requireSession();

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundError('Wallet');
    }

    if (wallet.userId !== actor.userId) {
      throw new ForbiddenError('You can only manage your own wallets.');
    }

    await prisma.$transaction([
      prisma.wallet.updateMany({
        where: {
          userId: actor.userId,
          chainId: wallet.chainId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      }),
      prisma.wallet.update({
        where: { id: walletId },
        data: { isPrimary: true },
      }),
    ]);

    const updated = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    return success(
      {
        id: updated!.id,
        chainId: updated!.chainId,
        address: updated!.address,
        isPrimary: updated!.isPrimary,
        label: updated!.label,
        createdAt: updated!.createdAt.toISOString(),
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'NOT_FOUND', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      requestId,
    );
  }
}
