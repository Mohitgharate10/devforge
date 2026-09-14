import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { failure } from '@/server/shared/http/api-response';
import { auth } from '@/server/auth/index';
import { resolveActor } from '@/server/auth/middleware';

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const actor = await resolveActor();
    if (!actor) {
      return failure(
        {
          code: 'UNAUTHENTICATED',
          message: 'Session required.',
          status: 401,
        },
        requestId,
      );
    }

    const reqHeaders = await headers();
    const res = await auth.api.signOut({
      headers: reqHeaders,
      asResponse: true,
    });

    const response = new NextResponse(null, { status: 204 });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }

    return response;
  } catch {
    return failure(
      {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        status: 500,
      },
      requestId,
    );
  }
}
