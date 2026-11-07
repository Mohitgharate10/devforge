import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { normalizeEmail } from '@devforge/domain';
import { hash } from '@node-rs/argon2';
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
    const rawDisplayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    const selectedRole: 'client' | 'freelancer' = body.role === 'client' ? 'client' : 'freelancer';
    const rawHandle = typeof body.handle === 'string' ? body.handle.trim() : '';

    if (!rawEmail || !rawEmail.includes('@')) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'A valid email address is required.',
          status: 400,
        },
        requestId,
      );
    }

    if (!rawDisplayName || rawDisplayName.length < 2) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'Full name / organization must be at least 2 characters.',
          status: 400,
        },
        requestId,
      );
    }

    if (rawPassword.length < 8) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'Password must be at least 8 characters long.',
          status: 400,
        },
        requestId,
      );
    }

    const email = normalizeEmail(rawEmail);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return failure(
        {
          code: 'CONFLICT',
          message: 'An account with this email already exists. Please sign in.',
          status: 409,
        },
        requestId,
      );
    }

    const passwordHash = await hash(rawPassword);
    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          email,
          displayName: rawDisplayName,
          passwordHash,
          status: 'ACTIVE',
        },
      });
      const roleRecord = await transaction.role.upsert({
        where: { name: selectedRole },
        update: {},
        create: { name: selectedRole },
      });

      await transaction.userRole.create({
        data: {
          userId: createdUser.id,
          roleId: roleRecord.id,
        },
      });

      if (selectedRole === 'client') {
        await transaction.clientProfile.create({
          data: {
            userId: createdUser.id,
            organizationName: rawDisplayName,
            slug: `org-${createdUser.id.slice(0, 8)}`,
            description: 'Web3 Protocol / Client Team',
          },
        });
      } else {
        const sanitized = rawHandle
          ? rawHandle.toLowerCase().replace(/[^a-z0-9_]/g, '')
          : rawDisplayName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const handle = `${sanitized.slice(0, 18)}_${Date.now().toString(36).slice(-4)}`;

        await transaction.freelancerProfile.create({
          data: {
            userId: createdUser.id,
            handle,
            title:
              typeof body.title === 'string' && body.title
                ? body.title
                : 'Web3 Technical Specialist',
            bio:
              typeof body.bio === 'string' && body.bio
                ? body.bio
                : 'Technical specialist on DevForge.',
            hourlyRate:
              typeof body.hourlyRate === 'string' && !isNaN(Number(body.hourlyRate))
                ? Math.round(Number(body.hourlyRate) * 100)
                : 15000,
          },
        });
      }

      return createdUser;
    });
    const session = await createSession(user.id, request);

    const response = success(
      {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          emailVerified: false,
          status: user.status,
          roles: [selectedRole],
          createdAt: user.createdAt.toISOString(),
        },
      },
      requestId,
      201,
    );

    response.headers.set('Set-Cookie', serializeSessionCookie(session.token));

    return response;
  } catch (error) {
    console.error('Sign-up error:', error);
    return failure(
      {
        code: 'INTERNAL_ERROR',
        message: 'Could not create account in database. Please check your inputs.',
        status: 500,
      },
      requestId,
    );
  }
}
