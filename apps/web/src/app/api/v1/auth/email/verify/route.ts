import { NextResponse } from 'next/server';
import { emailVerifyRequestSchema } from '@devforge/api-contracts';
import { prisma } from '@devforge/database';
import { success, failure } from '@/server/shared/http/api-response';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const body = await request.json();
    const parsed = emailVerifyRequestSchema.parse(body);

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash: parsed.token },
    });

    if (!tokenRecord || tokenRecord.type !== 'EMAIL_VERIFICATION' || tokenRecord.usedAt) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'Token is invalid or has already been used.',
          status: 400,
        },
        requestId,
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'Token has expired.',
          status: 400,
        },
        requestId,
      );
    }

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    return success({ verified: true }, requestId, 200);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: error.message,
          status: 400,
        },
        requestId,
      );
    }
    return failure(
      {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        status: 500,
      },
      requestId,
    );
  }
}
