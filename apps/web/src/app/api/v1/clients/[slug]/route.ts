import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { NotFoundError, DomainError } from '@devforge/domain';
import { success, failure } from '@/server/shared/http/api-response';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { slug } = await params;

  try {
    const client = await prisma.clientProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            displayName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client profile');
    }

    return success(
      {
        id: client.id,
        organizationName: client.organizationName,
        slug: client.slug,
        description: client.description,
        website: client.website,
        contactName: client.user.displayName,
        avatarUrl: client.user.avatarUrl,
        memberSince: client.user.createdAt.toISOString(),
      },
      requestId,
    );
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
