import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { walletNonceRequestSchema } from '@devforge/api-contracts';
import {
  generateNonce,
  getNonceExpiresAt,
  buildSiweMessage,
  normalizeAddress,
  DomainError,
} from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { optionalSession } from '@/server/auth/middleware';
import { environment } from '@/server/shared/env';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const body = await request.json();
    const parsed = walletNonceRequestSchema.parse(body);
    const actor = await optionalSession();

    if (parsed.action === 'link' && !actor) {
      return failure(
        { code: 'UNAUTHENTICATED', message: 'Session required to link a wallet.', status: 401 },
        requestId,
      );
    }

    const address = normalizeAddress(parsed.address);
    const nonce = generateNonce();
    const expiresAt = getNonceExpiresAt();
    const issuedAt = new Date().toISOString();

    await prisma.walletNonce.create({
      data: {
        userId: actor?.userId ?? null,
        address,
        chainId: parsed.chainId,
        nonce,
        expiresAt,
      },
    });

    const appUrl = new URL(environment.NEXT_PUBLIC_APP_URL);

    const statement =
      parsed.action === 'link'
        ? 'Link this wallet to your DevForge account.'
        : 'Sign in to DevForge with your Ethereum wallet.';

    const message = buildSiweMessage({
      domain: appUrl.host,
      address: parsed.address,
      statement,
      uri: environment.NEXT_PUBLIC_APP_URL,
      version: '1',
      chainId: parsed.chainId,
      nonce,
      issuedAt,
      expirationTime: expiresAt.toISOString(),
    });

    return success({ message, nonce }, requestId, 201);
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'RATE_LIMITED', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      requestId,
    );
  }
}
