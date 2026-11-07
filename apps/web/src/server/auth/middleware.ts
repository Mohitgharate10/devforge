import { headers } from 'next/headers';
import { prisma } from '@devforge/database';
import {
  type Actor,
  requireActiveUser,
  requireRole as domainRequireRole,
  requirePermission as domainRequirePermission,
} from '@devforge/domain';
import { getSessionToken, hashSessionToken } from './session';

export async function resolveActor(overrideHeaders?: Headers): Promise<Actor | null> {
  let reqHeaders: Headers;
  try {
    reqHeaders = overrideHeaders ?? (await headers());
  } catch {
    reqHeaders = overrideHeaders ?? new Headers();
  }
  try {
    const token = getSessionToken(reqHeaders);
    if (token) {
      const session = await prisma.session.findFirst({
        where: {
          tokenHash: hashSessionToken(token),
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            include: {
              userRoles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: { permission: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (session && session.user.status === 'ACTIVE') {
        return {
          userId: session.user.id,
          status: session.user.status,
          roles: [...new Set(session.user.userRoles.map((userRole) => userRole.role.name))],
          permissions: [
            ...new Set(
              session.user.userRoles.flatMap((userRole) =>
                userRole.role.permissions.map((rolePermission) => rolePermission.permission.key),
              ),
            ),
          ],
        };
      }
    }

    if (process.env.NODE_ENV === 'test') {
      const testUserId = reqHeaders.get('x-user-id');
      if (testUserId) {
        return {
          userId: testUserId,
          status: 'ACTIVE',
          roles: ['freelancer', 'client'],
          permissions: ['jobs:create', 'proposals:create'],
        };
      }
    }

    return null;
  } catch (err) {
    console.error('Failed to resolve authenticated session:', err);
    throw err;
  }
}

export async function requireSession(requestHeaders?: Headers): Promise<Actor> {
  const actor = await resolveActor(requestHeaders);
  requireActiveUser(actor);
  return actor;
}

export async function optionalSession(requestHeaders?: Headers): Promise<Actor | null> {
  return resolveActor(requestHeaders);
}

export async function requireRole(role: string, requestHeaders?: Headers): Promise<Actor> {
  const actor = await requireSession(requestHeaders);
  domainRequireRole(actor, role);
  return actor;
}

export async function requirePermission(
  permission: string,
  requestHeaders?: Headers,
): Promise<Actor> {
  const actor = await requireSession(requestHeaders);
  domainRequirePermission(actor, permission);
  return actor;
}
