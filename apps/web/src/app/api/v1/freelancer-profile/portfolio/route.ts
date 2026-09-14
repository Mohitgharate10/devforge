import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { portfolioProjectSchema } from '@devforge/api-contracts';
import { NotFoundError, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireRole } from '@/server/auth/middleware';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await requireRole('freelancer');
    const body = await request.json();
    const parsed = portfolioProjectSchema.parse(body);

    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: actor.userId },
    });

    if (!profile) {
      throw new NotFoundError('Freelancer profile (please create your profile first)');
    }

    const project = await prisma.portfolioProject.create({
      data: {
        freelancerProfileId: profile.id,
        title: parsed.title,
        description: parsed.description,
        projectUrl: parsed.projectUrl || null,
        repositoryUrl: parsed.repositoryUrl || null,
        coverImageUrl: parsed.coverImageUrl || null,
        isPublished: parsed.isPublished,
        displayOrder: parsed.displayOrder,
      },
    });

    return success(project, requestId, 201);
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
