import { NextResponse } from 'next/server';
import { prisma } from '@devforge/database';
import {
  getSessionToken,
  hashSessionToken,
  serializeExpiredSessionCookie,
} from '@/server/auth/session';

export async function POST(request: Request): Promise<NextResponse> {
  const token = getSessionToken(request.headers);
  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }

  const response = new NextResponse(
    JSON.stringify({ data: { success: true }, meta: { requestId: crypto.randomUUID() } }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': serializeExpiredSessionCookie(),
      },
    },
  );
  return response;
}
