import {
  AccountClosedError,
  AccountSuspendedError,
  ForbiddenError,
  UnauthenticatedError,
} from './auth.errors';

export type Actor = {
  userId: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  roles: string[];
  permissions: string[];
};

export function requireActiveUser(actor: Actor | null): asserts actor is Actor {
  if (!actor) {
    throw new UnauthenticatedError();
  }
  if (actor.status === 'SUSPENDED') {
    throw new AccountSuspendedError();
  }
  if (actor.status === 'CLOSED') {
    throw new AccountClosedError();
  }
}

export function requireRole(actor: Actor, role: string): void {
  if (!actor.roles.includes(role)) {
    throw new ForbiddenError(`Role '${role}' is required.`);
  }
}

export function requirePermission(actor: Actor, permission: string): void {
  if (!actor.permissions.includes(permission)) {
    throw new ForbiddenError(`Permission '${permission}' is required.`);
  }
}

export function requireSelf(actor: Actor, resourceOwnerId: string): void {
  if (actor.userId !== resourceOwnerId) {
    throw new ForbiddenError('You can only access your own resources.');
  }
}

export function hasRole(actor: Actor, role: string): boolean {
  return actor.roles.includes(role);
}

export function hasPermission(actor: Actor, permission: string): boolean {
  return actor.permissions.includes(permission);
}
