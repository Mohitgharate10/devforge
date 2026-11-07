import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { normalizeEmail } from '@devforge/domain';
import { hash } from '@node-rs/argon2';
import { success, failure } from '@/server/shared/http/api-response';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const body = await request.json().catch(() => ({}));
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

    if (rawPassword && rawPassword.length < 6) {
      return failure(
        {
          code: 'VALIDATION_FAILED',
          message: 'Password must be at least 6 characters long.',
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

    // Hash password with Argon2
    const passwordToHash = rawPassword || 'DevForgePass123!';
    const passwordHash = await hash(passwordToHash);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        displayName: rawDisplayName,
        passwordHash,
        status: 'ACTIVE',
      },
    });

    // Ensure role exists and map to user
    let roleRecord = await prisma.role.findUnique({
      where: { name: selectedRole },
    });
    if (!roleRecord) {
      roleRecord = await prisma.role.create({
        data: { name: selectedRole },
      });
    }

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: roleRecord.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: roleRecord.id,
      },
    });

    // Create appropriate role profile
    if (selectedRole === 'client') {
      const slug = `org-${user.id.slice(0, 8)}`;
      await prisma.clientProfile.upsert({
        where: { userId: user.id },
        update: { organizationName: rawDisplayName },
        create: {
          userId: user.id,
          organizationName: rawDisplayName,
          slug,
          description: 'Web3 Protocol / Client Team',
        },
      });
    } else {
      const sanitized = rawHandle
        ? rawHandle.toLowerCase().replace(/[^a-z0-9_]/g, '')
        : rawDisplayName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const handle = `${sanitized.slice(0, 18)}_${Date.now().toString(36).slice(-4)}`;

      await prisma.freelancerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          handle,
          title:
            typeof body.title === 'string' && body.title ? body.title : 'Web3 Technical Specialist',
          bio:
            typeof body.bio === 'string' && body.bio
              ? body.bio
              : 'Verified technical specialist on DevForge.',
          hourlyRate:
            typeof body.hourlyRate === 'string' && !isNaN(Number(body.hourlyRate))
              ? Math.round(Number(body.hourlyRate) * 100)
              : 15000,
        },
      });
    }

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

    // Set cookie for automatic cross-route authentication
    response.headers.set(
      'Set-Cookie',
      `devforge_session=${user.id}; Path=/; Max-Age=2592000; SameSite=Lax`,
    );

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
