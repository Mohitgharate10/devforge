import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { addFreelancerSkillSchema } from '@devforge/api-contracts';
import { NotFoundError, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireRole } from '@/server/auth/middleware';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await requireRole('freelancer');
    const body = await request.json();
    const parsed = addFreelancerSkillSchema.parse(body);

    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: actor.userId },
    });

    if (!profile) {
      throw new NotFoundError('Freelancer profile (please create your profile first)');
    }

    const skill = await prisma.skill.findUnique({
      where: { id: parsed.skillId, isActive: true },
    });

    if (!skill) {
      throw new NotFoundError('Active skill');
    }

    const freelancerSkill = await prisma.freelancerSkill.upsert({
      where: {
        freelancerProfileId_skillId: {
          freelancerProfileId: profile.id,
          skillId: parsed.skillId,
        },
      },
      update: {
        proficiency: parsed.proficiency,
        displayOrder: parsed.displayOrder,
      },
      create: {
        freelancerProfileId: profile.id,
        skillId: parsed.skillId,
        proficiency: parsed.proficiency,
        displayOrder: parsed.displayOrder,
      },
      include: {
        skill: true,
      },
    });

    return success(
      {
        skillId: freelancerSkill.skillId,
        name: freelancerSkill.skill.name,
        slug: freelancerSkill.skill.slug,
        category: freelancerSkill.skill.category,
        proficiency: freelancerSkill.proficiency,
        displayOrder: freelancerSkill.displayOrder,
      },
      requestId,
      201,
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'NOT_FOUND', message: error.message, status: error.statusCode },
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
