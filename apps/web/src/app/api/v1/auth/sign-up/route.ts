import { NextResponse } from 'next/server';
import { signUpRequestSchema } from '@devforge/api-contracts';
import { prisma } from '@devforge/database';
import { normalizeEmail } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { auth } from '@/server/auth/index';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const body = await request.json();
    const parsed = signUpRequestSchema.parse(body);
    const email = normalizeEmail(parsed.email);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return failure(
        {
          code: 'CONFLICT',
          message: 'An account with this email already exists.',
          status: 409,
        },
        requestId,
      );
    }

    const res = await auth.api.signUpEmail({
      body: {
        email,
        password: parsed.password,
        name: parsed.displayName,
      },
      asResponse: true,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: (err as { message?: string }).message ?? 'Failed to create account.',
          status: 400,
        },
        requestId,
      );
    }

    const createdUser = await prisma.user.findUnique({
      where: { email },
    });

    // Ensure selected role exists and is assigned
    if (createdUser && parsed.role) {
      const targetRole = await prisma.role.findUnique({
        where: { name: parsed.role },
      });
      if (targetRole) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: createdUser.id,
              roleId: targetRole.id,
            },
          },
          update: {},
          create: {
            userId: createdUser.id,
            roleId: targetRole.id,
          },
        });
      }
    }

    const finalUser = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    const response = success(
      {
        id: finalUser?.id,
        email: finalUser?.email,
        displayName: finalUser?.displayName,
        avatarUrl: finalUser?.avatarUrl,
        emailVerified: !!finalUser?.emailVerifiedAt,
        status: finalUser?.status ?? 'ACTIVE',
        roles: finalUser?.userRoles.map((ur) => ur.role.name) ?? [parsed.role],
        createdAt: finalUser?.createdAt.toISOString(),
      },
      requestId,
      201,
    );

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }

    return response;
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
