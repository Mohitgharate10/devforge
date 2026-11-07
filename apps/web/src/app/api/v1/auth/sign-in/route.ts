import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { normalizeEmail } from '@devforge/domain';
import { verify } from '@node-rs/argon2';
import { success, failure } from '@/server/shared/http/api-response';
import { createSession, serializeSessionCookie } from '@/server/auth/session';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return failure(
        { code: 'VALIDATION_FAILED', message: 'A valid request body is required.', status: 400 },
        requestId,
      );
    }
    const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
    const rawPassword = typeof body.password === 'string' ? body.password : '';
    const requestedRole = body.role === 'client' || body.role === 'freelancer' ? body.role : null;

    if (!rawEmail || !rawEmail.includes('@') || !rawPassword) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'A valid email address and password are required.',
          status: 400,
        },
        requestId,
      );
    }

    const email = normalizeEmail(rawEmail);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return failure(
        {
          code: 'UNAUTHENTICATED',
          message: 'Invalid email or password.',
          status: 401,
        },
        requestId,
      );
    }

    if (user.status === 'SUSPENDED' || user.status === 'CLOSED') {
      return failure(
        {
          code: 'FORBIDDEN',
          message: `Account is ${user.status.toLowerCase()}. Please contact support.`,
          status: 403,
        },
        requestId,
      );
    }

    if (user.passwordHash) {
      try {
        const matches = await verify(user.passwordHash, rawPassword);
        if (!matches) {
          return failure(
            {
              code: 'UNAUTHENTICATED',
              message: 'Invalid email or password.',
              status: 401,
            },
            requestId,
          );
        }
      } catch {
        return failure(
          {
            code: 'UNAUTHENTICATED',
            message: 'Invalid email or password.',
            status: 401,
          },
          requestId,
        );
      }
    } else {
      return failure(
        {
          code: 'UNAUTHENTICATED',
          message: 'Invalid email or password.',
          status: 401,
        },
        requestId,
      );
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const role =
      requestedRole && roles.includes(requestedRole)
        ? requestedRole
        : roles.includes('client')
          ? 'client'
          : roles.includes('freelancer')
            ? 'freelancer'
            : 'admin';
    const session = await createSession(user.id, request, body.rememberMe !== false);

    const response = success(
      {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          emailVerified: !!user.emailVerifiedAt,
          status: user.status,
          roles: roles.length > 0 ? roles : ['client', 'freelancer'],
          createdAt: user.createdAt.toISOString(),
          role,
        },
      },
      requestId,
      200,
    );

    response.headers.set(
      'Set-Cookie',
      serializeSessionCookie(session.token, body.rememberMe !== false),
    );

    return response;
  } catch (error) {
    console.error('Sign-in error:', error);
    return failure(
      {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during sign-in.',
        status: 500,
      },
      requestId,
    );
  }
}
