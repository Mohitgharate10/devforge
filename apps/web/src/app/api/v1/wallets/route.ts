import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await requireSession();

    const wallets = await prisma.wallet.findMany({
      where: { userId: actor.userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return success(
      wallets.map((w) => ({
        id: w.id,
        chainId: w.chainId,
        address: w.address,
        isPrimary: w.isPrimary,
        label: w.label,
        createdAt: w.createdAt.toISOString(),
      })),
      requestId,
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'UNAUTHENTICATED', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      requestId,
    );
  }
}
