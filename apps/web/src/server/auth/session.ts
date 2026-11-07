import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@devforge/database';

export const SESSION_COOKIE_NAME = 'devforge_session';
const REMEMBERED_SESSION_SECONDS = 60 * 60 * 24 * 7;
const TEMPORARY_SESSION_SECONDS = 60 * 60 * 24;

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getSessionToken(headers: Headers): string | null {
  const cookieHeader = headers.get('cookie');
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${SESSION_COOKIE_NAME}=`));

  return cookie?.slice(SESSION_COOKIE_NAME.length + 1) || null;
}

export function serializeSessionCookie(token: string, rememberMe = true): string {
  const parts = [`${SESSION_COOKIE_NAME}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];

  if (rememberMe) {
    parts.push(`Max-Age=${REMEMBERED_SESSION_SECONDS}`);
  }
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function serializeExpiredSessionCookie(): string {
  const parts = [`${SESSION_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export async function createSession(userId: string, request: Request, rememberMe = true) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(
    Date.now() + (rememberMe ? REMEMBERED_SESSION_SECONDS : TEMPORARY_SESSION_SECONDS) * 1000,
  );
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || null;

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
      ipAddress,
      userAgent: request.headers.get('user-agent'),
    },
  });

  return { token, expiresAt };
}
