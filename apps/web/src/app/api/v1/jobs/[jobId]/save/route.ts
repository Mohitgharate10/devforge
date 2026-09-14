import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { DomainError, NotFoundError } from '@devforge/domain';
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
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Job');
    }

    await prisma.savedJob.upsert({
      where: {
        userId_jobId: {
          userId: actor.userId,
          jobId,
        },
      },
      create: {
        userId: actor.userId,
        jobId,
      },
      update: {},
    });

    return success({ saved: true }, requestId, 201);
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'NOT_FOUND', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Could not save job.', status: 500 },
      requestId,
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { jobId } = await params;

  try {
    const actor = await requireSession();

    await prisma.savedJob.deleteMany({
      where: {
        userId: actor.userId,
        jobId,
      },
    });

    return success({ saved: false }, requestId);
  } catch (error) {
    if (error instanceof DomainError) {
      return failure(
        { code: error.code as 'NOT_FOUND', message: error.message, status: error.statusCode },
        requestId,
      );
    }
    return failure(
      { code: 'INTERNAL_ERROR', message: 'Could not remove saved job.', status: 500 },
      requestId,
    );
  }
}
