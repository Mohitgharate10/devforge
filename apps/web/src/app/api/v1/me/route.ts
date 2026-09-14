import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { updateUserRequestSchema } from '@devforge/api-contracts';
import { NotFoundError, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await requireSession();

    const user = await prisma.user.findUnique({
      where: { id: actor.userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return success(
      {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        emailVerified: !!user.emailVerifiedAt,
        status: user.status,
        roles: user.userRoles.map((ur) => ur.role.name),
        createdAt: user.createdAt.toISOString(),
      },
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

export async function PATCH(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await requireSession();
    const body = await request.json();
    const parsed = updateUserRequestSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: actor.userId },
      data: {
        ...(parsed.displayName !== undefined && { displayName: parsed.displayName }),
        ...(parsed.avatarUrl !== undefined && { avatarUrl: parsed.avatarUrl }),
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    return success(
      {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        emailVerified: !!user.emailVerifiedAt,
        status: user.status,
        roles: user.userRoles.map((ur) => ur.role.name),
        createdAt: user.createdAt.toISOString(),
      },
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
