import { NextResponse } from 'next/server';
import { passwordForgotRequestSchema } from '@devforge/api-contracts';
import { prisma } from '@devforge/database';
import { normalizeEmail } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const body = await request.json();
    const parsed = passwordForgotRequestSchema.parse(body);
    const email = normalizeEmail(parsed.email);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.verificationToken.create({
        data: {
          tokenHash: token,
          type: 'PASSWORD_RESET',
          userId: user.id,
          expiresAt,
        },
      });

      // In development, log the reset token to the console
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[Auth] Password reset token for ${email}: ${token}`);
      }
    }

    // Per API.md: "always generic response" (202 Accepted)
    return success(
      { message: 'If an account exists with this email, a reset link has been dispatched.' },
      requestId,
      202,
    );
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
