import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { NotFoundError, DomainError } from '@devforge/domain';
import { failure } from '@/server/shared/http/api-response';
import { requireRole } from '@/server/auth/middleware';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ skillId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { skillId } = await params;

  try {
    const actor = await requireRole('freelancer');

    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: actor.userId },
    });

    if (!profile) {
      throw new NotFoundError('Freelancer profile');
    }

    const existing = await prisma.freelancerSkill.findUnique({
      where: {
        freelancerProfileId_skillId: {
          freelancerProfileId: profile.id,
          skillId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Skill on freelancer profile');
    }

    await prisma.freelancerSkill.delete({
      where: {
        freelancerProfileId_skillId: {
          freelancerProfileId: profile.id,
          skillId,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'NOT_FOUND', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      requestId,
    );
  }
}
