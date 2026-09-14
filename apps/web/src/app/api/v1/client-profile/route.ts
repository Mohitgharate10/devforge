import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { upsertClientProfileSchema } from '@devforge/api-contracts';
import { DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';
import { requireRole } from '@/server/auth/middleware';

export async function PUT(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await requireRole('client');
    const body = await request.json();
    const parsed = upsertClientProfileSchema.parse(body);

    if (parsed.slug) {
      const existingSlug = await prisma.clientProfile.findUnique({
        where: { slug: parsed.slug },
      });
      if (existingSlug && existingSlug.userId !== actor.userId) {
        return failure(
          { code: 'CONFLICT', message: 'Organization slug is already taken.', status: 409 },
          requestId,
        );
      }
    }

    const client = await prisma.clientProfile.upsert({
      where: { userId: actor.userId },
      update: {
        organizationName: parsed.organizationName,
        slug: parsed.slug || null,
        description: parsed.description || null,
        website: parsed.website || null,
      },
      create: {
        userId: actor.userId,
        organizationName: parsed.organizationName,
        slug: parsed.slug || null,
        description: parsed.description || null,
        website: parsed.website || null,
      },
    });

    return success(client, requestId);
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
