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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
    return null;
  }

  const roles = user.userRoles.map((ur) => ur.role.name);
  const permissions = user.userRoles.flatMap((ur) =>
    ur.role.permissions.map((rp) => rp.permission.key),
  );

  return {
    userId: user.id,
    status: user.status,
    roles: [...new Set(roles)],
    permissions: [...new Set(permissions)],
  };
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
