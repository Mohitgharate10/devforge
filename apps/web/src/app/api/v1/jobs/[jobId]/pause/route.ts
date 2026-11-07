import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import {
  assertJobOwnership,
  assertCanTransitionJobStatus,
  DomainError,
  NotFoundError,
} from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireSession } from '@/server/auth/middleware';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { jobId } = await params;

  try {
    const actor = await requireSession();
    const existing = await prisma.job.findUnique({
      where: { id: jobId },
      include: { clientProfile: true },
    });

    if (!existing) {
      throw new NotFoundError('Job');
    }

    assertJobOwnership(actor.userId, existing.clientProfile.userId);
    assertCanTransitionJobStatus(existing.status, 'PAUSED');

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { status: 'PAUSED' },
    });

    return success(
      {
        id: updated.id,
        status: updated.status,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        {
          code: error.code as 'VALIDATION_FAILED',
          message: error.message,
          status: error.statusCode,
        },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Could not pause job.', status: 500 },
      requestId,
    );
  }
}
