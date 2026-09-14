import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { updatePortfolioProjectSchema } from '@devforge/api-contracts';
import { NotFoundError, DomainError, requireProfileOwner } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireRole } from '@/server/auth/middleware';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { id } = await params;

  try {
    const actor = await requireRole('freelancer');
    const body = await request.json();
    const parsed = updatePortfolioProjectSchema.parse(body);

    const existing = await prisma.portfolioProject.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!existing) {
      throw new NotFoundError('Portfolio project');
    }

    requireProfileOwner(actor.userId, existing.profile.userId);

    const updated = await prisma.portfolioProject.update({
      where: { id },
      data: {
        ...(parsed.title !== undefined && { title: parsed.title }),
        ...(parsed.description !== undefined && { description: parsed.description }),
        ...(parsed.projectUrl !== undefined && { projectUrl: parsed.projectUrl || null }),
        ...(parsed.repositoryUrl !== undefined && { repositoryUrl: parsed.repositoryUrl || null }),
        ...(parsed.coverImageUrl !== undefined && { coverImageUrl: parsed.coverImageUrl || null }),
        ...(parsed.isPublished !== undefined && { isPublished: parsed.isPublished }),
        ...(parsed.displayOrder !== undefined && { displayOrder: parsed.displayOrder }),
      },
    });

    return success(updated, requestId);
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { id } = await params;

  try {
    const actor = await requireRole('freelancer');

    const existing = await prisma.portfolioProject.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!existing) {
      throw new NotFoundError('Portfolio project');
    }

    requireProfileOwner(actor.userId, existing.profile.userId);

    await prisma.portfolioProject.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'FORBIDDEN', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      requestId,
    );
  }
}
