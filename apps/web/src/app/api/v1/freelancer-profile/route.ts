import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { upsertFreelancerProfileSchema } from '@devforge/api-contracts';
import { normalizeHandle, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireRole } from '@/server/auth/middleware';

export async function PUT(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await requireRole('freelancer');
    const body = await request.json();
    const parsed = upsertFreelancerProfileSchema.parse(body);
    const handle = normalizeHandle(parsed.handle);

    // Check handle collision with another user
    const existingWithHandle = await prisma.freelancerProfile.findUnique({
      where: { handle },
    });

    if (existingWithHandle && existingWithHandle.userId !== actor.userId) {
      return failure(
        {
          code: 'CONFLICT',
          message: 'Handle is already taken by another freelancer.',
          status: 409,
        },
        requestId,
      );
    }

    const profile = await prisma.freelancerProfile.upsert({
      where: { userId: actor.userId },
      update: {
        handle,
        title: parsed.title,
        bio: parsed.bio,
        hourlyRate: parsed.hourlyRate !== undefined ? BigInt(parsed.hourlyRate) : undefined,
        availability: parsed.availability,
      },
      create: {
        userId: actor.userId,
        handle,
        title: parsed.title,
        bio: parsed.bio,
        hourlyRate: parsed.hourlyRate !== undefined ? BigInt(parsed.hourlyRate) : undefined,
        availability: parsed.availability,
      },
      include: {
        skills: {
          include: { skill: true },
          orderBy: { displayOrder: 'asc' },
        },
        portfolioProjects: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return success(
      {
        id: profile.id,
        userId: profile.userId,
        handle: profile.handle,
        title: profile.title,
        bio: profile.bio,
        hourlyRate: profile.hourlyRate ? Number(profile.hourlyRate) : null,
        availability: profile.availability,
        skills: profile.skills.map((s) => ({
          skillId: s.skillId,
          name: s.skill.name,
          slug: s.skill.slug,
          category: s.skill.category,
          proficiency: s.proficiency,
        })),
        portfolioProjects: profile.portfolioProjects,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
      requestId,
      200,
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'FORBIDDEN', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return failure({ code: 'VALIDATION_FAILED', message: error.message, status: 400 }, requestId);
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      requestId,
    );
  }
}
