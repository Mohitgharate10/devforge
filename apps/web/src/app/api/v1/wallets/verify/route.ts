import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { walletVerifyRequestSchema } from '@devforge/api-contracts';
import {
  requireValidSignature,
  normalizeAddress,
  isNonceExpired,
  isNonceUsed,
  DomainError,
  TokenExpiredError,
  TokenInvalidError,
} from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const body = await request.json();
    const parsed = walletVerifyRequestSchema.parse(body);

    const nonceRecord = await prisma.walletNonce.findUnique({
      where: { nonce: parsed.nonce },
    });

    if (!nonceRecord) {
      throw new TokenInvalidError();
    }

    if (isNonceUsed(nonceRecord.usedAt)) {
      throw new TokenInvalidError();
    }

    if (isNonceExpired(nonceRecord.expiresAt)) {
      throw new TokenExpiredError();
    }

    await requireValidSignature({
      address: nonceRecord.address,
      message: parsed.message,
      signature: parsed.signature,
    });

    await prisma.walletNonce.update({
      where: { id: nonceRecord.id },
      data: { usedAt: new Date() },
    });

    const address = normalizeAddress(nonceRecord.address);
    const actor = await optionalSession();

    if (actor) {
      const existingWallet = await prisma.wallet.findUnique({
        where: { chainId_address: { chainId: nonceRecord.chainId, address } },
      });

      if (existingWallet) {
        return failure(
          { code: 'CONFLICT', message: 'Wallet is already linked to an account.', status: 409 },
          requestId,
        );
      }

      const walletCount = await prisma.wallet.count({
        where: { userId: actor.userId, chainId: nonceRecord.chainId },
      });

      const wallet = await prisma.wallet.create({
        data: {
          userId: actor.userId,
          chainId: nonceRecord.chainId,
          address,
          isPrimary: walletCount === 0,
        },
      });

      return success(
        {
          id: wallet.id,
          chainId: wallet.chainId,
          address: wallet.address,
          isPrimary: wallet.isPrimary,
          label: wallet.label,
          createdAt: wallet.createdAt.toISOString(),
        },
        requestId,
      );
    }

    const existingWallet = await prisma.wallet.findUnique({
      where: { chainId_address: { chainId: nonceRecord.chainId, address } },
      include: {
        user: {
          include: {
            userRoles: { include: { role: true } },
          },
        },
      },
    });

    if (!existingWallet) {
      return failure(
        {
          code: 'NOT_FOUND',
          message: 'No account linked to this wallet. Please sign up first.',
          status: 404,
        },
        requestId,
      );
    }

    return success(
      {
        user: {
          id: existingWallet.user.id,
          email: existingWallet.user.email,
          displayName: existingWallet.user.displayName,
          avatarUrl: existingWallet.user.avatarUrl,
          emailVerified: !!existingWallet.user.emailVerifiedAt,
          status: existingWallet.user.status,
          roles: existingWallet.user.userRoles.map((ur) => ur.role.name),
          createdAt: existingWallet.user.createdAt.toISOString(),
        },
        wallet: {
          id: existingWallet.id,
          chainId: existingWallet.chainId,
          address: existingWallet.address,
          isPrimary: existingWallet.isPrimary,
          label: existingWallet.label,
          createdAt: existingWallet.createdAt.toISOString(),
        },
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        {
          code: error.code as 'VALIDATION_FAILED',
          message: error.message,
          status: error.statusCode,
        },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      requestId,
    );
  }
}
