import { NextResponse } from 'next/server';
import { signInRequestSchema } from '@devforge/api-contracts';
import { prisma } from '@devforge/database';
import { normalizeEmail } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { auth } from '@/server/auth/index';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const body = await request.json();
    const parsed = signInRequestSchema.parse(body);
    const email = normalizeEmail(parsed.email);

    const res = await auth.api.signInEmail({
      body: {
        email,
        password: parsed.password,
      },
      asResponse: true,
    });

    if (!res.ok) {
      return failure(
        {
          code: 'UNAUTHENTICATED',
          message: 'Invalid email or password.',
          status: 401,
        },
        requestId,
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    const response = success(
      {
        user: {
          id: user?.id,
          email: user?.email,
          displayName: user?.displayName,
          avatarUrl: user?.avatarUrl,
          emailVerified: !!user?.emailVerifiedAt,
          status: user?.status ?? 'ACTIVE',
          roles: user?.userRoles.map((ur) => ur.role.name) ?? [],
          createdAt: user?.createdAt.toISOString(),
        },
      },
      requestId,
      200,
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
