import { headers } from 'next/headers';
import { prisma } from '@devforge/database';
import {
  type Actor,
  requireActiveUser,
  requireRole as domainRequireRole,
  requirePermission as domainRequirePermission,
} from '@devforge/domain';
import { auth } from './index';

export async function resolveActor(): Promise<Actor | null> {
  const reqHeaders = await headers();
  let targetUserId: string | null = null;

  try {
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });
    if (session?.user?.id) {
      targetUserId = session.user.id;
    }
  } catch {
    // Better Auth session lookup error fallback
  }

  // Fallback to devforge_session cookie or x-user-id header
  if (!targetUserId) {
    const cookieHeader = reqHeaders.get('cookie') || '';
    const match = cookieHeader.match(/devforge_session=([^;]+)/);
    if (match && match[1]) {
      targetUserId = decodeURIComponent(match[1].trim());
    } else {
      const headerUserId = reqHeaders.get('x-user-id');
      if (headerUserId) {
        targetUserId = headerUserId.trim();
      }
    }
  }

  if (!targetUserId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      // If user was not found by UUID directly, check if targetUserId was an email or handle
      const userByEmail = await prisma.user.findFirst({
        where: {
          OR: [
            { email: targetUserId },
            { displayName: targetUserId },
          ],
        },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!userByEmail) return null;

      const roles = userByEmail.userRoles.map((ur) => ur.role.name);
      const permissions = userByEmail.userRoles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.key),
      );

      return {
        userId: userByEmail.id,
        status: userByEmail.status,
        roles: [...new Set(roles.length > 0 ? roles : ['client', 'freelancer'])],
        permissions: [...new Set(permissions)],
      };
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.key),
    );

    return {
      userId: user.id,
      status: user.status,
      roles: [...new Set(roles.length > 0 ? roles : ['client', 'freelancer'])],
      permissions: [...new Set(permissions)],
    };
  } catch (err) {
    console.error('Error in resolveActor DB query:', err);
    return null;
  }
}

export async function requireSession(): Promise<Actor> {
  const actor = await resolveActor();
  requireActiveUser(actor);
  return actor;
}

export async function optionalSession(): Promise<Actor | null> {
  try {
    return await resolveActor();
  } catch {
    return null;
  }
}

export async function requireRole(role: string): Promise<Actor> {
  const actor = await requireSession();
  domainRequireRole(actor, role);
  return actor;
}

export async function requirePermission(permission: string): Promise<Actor> {
  const actor = await requireSession();
  domainRequirePermission(actor, permission);
  return actor;
}
