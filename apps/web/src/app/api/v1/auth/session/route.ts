import { NextResponse } from 'next/server';
import { success } from '@/server/shared/http/api-response';
import { resolveActor } from '@/server/auth/middleware';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const actor = await resolveActor();

  if (!actor) {
    return success({ user: null, expiresAt: null }, requestId);
  }

  return success(
    {
      user: {
        id: actor.userId,
        roles: actor.roles,
        status: actor.status,
      },
      expiresAt: null,
    },
    requestId,
  );
}
