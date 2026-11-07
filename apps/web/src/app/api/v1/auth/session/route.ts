import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import { success } from '@/server/shared/http/api-response';
import { resolveActor } from '@/server/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const actor = await resolveActor(request.headers);

  if (!actor) {
    return success({ user: null, expiresAt: null }, requestId);
  }

  const user = await prisma.user.findUnique({
    where: { id: actor.userId },
    include: { freelancerProfile: true },
  });
  if (!user || user.status !== 'ACTIVE') {
    return success({ user: null, expiresAt: null }, requestId);
  }

  return success(
    {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        roles: actor.roles,
        role: actor.roles.includes('client')
          ? 'client'
          : actor.roles.includes('freelancer')
            ? 'freelancer'
            : 'admin',
        handle: user.freelancerProfile?.handle,
      },
      expiresAt: null,
    },
    requestId,
  );
}
