import { describe, it, expect } from 'vitest';
import {
  type Actor,
  requireActiveUser,
  requireRole,
  requirePermission,
  requireSelf,
  hasRole,
  hasPermission,
} from './auth.policy.js';
import {
  UnauthenticatedError,
  AccountSuspendedError,
  AccountClosedError,
  ForbiddenError,
} from './auth.errors.js';

function createActor(overrides: Partial<Actor> = {}): Actor {
  return {
    userId: 'user-1',
    status: 'ACTIVE',
    roles: ['freelancer'],
    permissions: ['proposals:create'],
    ...overrides,
  };
}

describe('requireActiveUser', () => {
  it('throws UnauthenticatedError when actor is null', () => {
    expect(() => requireActiveUser(null)).toThrow(UnauthenticatedError);
  });

  it('throws AccountSuspendedError when status is SUSPENDED', () => {
    const actor = createActor({ status: 'SUSPENDED' });
    expect(() => requireActiveUser(actor)).toThrow(AccountSuspendedError);
  });

  it('throws AccountClosedError when status is CLOSED', () => {
    const actor = createActor({ status: 'CLOSED' });
    expect(() => requireActiveUser(actor)).toThrow(AccountClosedError);
  });

  it('passes for ACTIVE user', () => {
    const actor = createActor();
    expect(() => requireActiveUser(actor)).not.toThrow();
  });
});

describe('requireRole', () => {
  it('throws ForbiddenError when actor does not have the role', () => {
    const actor = createActor({ roles: ['freelancer'] });
    expect(() => requireRole(actor, 'admin')).toThrow(ForbiddenError);
  });

  it('passes when actor has the role', () => {
    const actor = createActor({ roles: ['freelancer', 'client'] });
    expect(() => requireRole(actor, 'client')).not.toThrow();
  });
});

describe('requirePermission', () => {
  it('throws ForbiddenError when actor lacks the permission', () => {
    const actor = createActor({ permissions: ['proposals:create'] });
    expect(() => requirePermission(actor, 'users:manage')).toThrow(ForbiddenError);
  });

  it('passes when actor has the permission', () => {
    const actor = createActor({ permissions: ['proposals:create', 'users:manage'] });
    expect(() => requirePermission(actor, 'users:manage')).not.toThrow();
  });
});

describe('requireSelf', () => {
  it('throws ForbiddenError when actor is not the resource owner', () => {
    const actor = createActor({ userId: 'user-1' });
    expect(() => requireSelf(actor, 'user-2')).toThrow(ForbiddenError);
  });

  it('passes when actor is the resource owner', () => {
    const actor = createActor({ userId: 'user-1' });
    expect(() => requireSelf(actor, 'user-1')).not.toThrow();
  });
});

describe('hasRole', () => {
  it('returns true when actor has the role', () => {
    expect(hasRole(createActor({ roles: ['admin'] }), 'admin')).toBe(true);
  });

  it('returns false when actor lacks the role', () => {
    expect(hasRole(createActor({ roles: ['freelancer'] }), 'admin')).toBe(false);
  });
});

describe('hasPermission', () => {
  it('returns true when actor has the permission', () => {
    expect(hasPermission(createActor({ permissions: ['audit:read'] }), 'audit:read')).toBe(true);
  });

  it('returns false when actor lacks the permission', () => {
    expect(hasPermission(createActor({ permissions: [] }), 'audit:read')).toBe(false);
  });
});
