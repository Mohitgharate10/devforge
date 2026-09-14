import { NextResponse } from 'next/server';
import { passwordResetRequestSchema } from '@devforge/api-contracts';
import { prisma } from '@devforge/database';
import { passwordSchema } from '@devforge/domain';
import { failure } from '@/server/shared/http/api-response';
import { auth } from '@/server/auth/index';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const body = await request.json();
    const parsed = passwordResetRequestSchema.parse(body);

    passwordSchema.parse(parsed.password);

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash: parsed.token },
    });

    if (!tokenRecord || tokenRecord.type !== 'PASSWORD_RESET' || tokenRecord.usedAt) {
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

    const ctx = await auth.$context;
    const passwordHash = await ctx.password.hash(parsed.password);

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      }),
      prisma.session.deleteMany({
        where: { userId: tokenRecord.userId },
      }),
    ]);

    // 204 No Content
    return new NextResponse(null, { status: 204 });
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
