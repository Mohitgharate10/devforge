import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DomainError,
  UnauthorizedError,
  ForbiddenError,
  AccountSuspendedError,
} from '@devforge/domain';

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock('@devforge/database', () => ({
  prisma: { session: { findFirst } },
}));

import { resolveActor, requireSession, requireRole } from './middleware';
import { hashSessionToken } from './session';

describe('auth middleware', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    findFirst.mockReset();
    findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('resolveActor', () => {
    it('rejects an unsigned user ID stored in the session cookie', async () => {
      const userId = '00000000-0000-4000-a000-000000000001';
      const actor = await resolveActor(new Headers({ cookie: `devforge_session=${userId}` }));

      expect(actor).toBeNull();
      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tokenHash: hashSessionToken(userId) }),
        }),
      );
    });

    it('ignores user ID headers outside the test environment', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const actor = await resolveActor(
        new Headers({ 'x-user-id': 'arbitrary-user-id', 'x-user-role': 'admin' }),
      );

      expect(actor).toBeNull();
      expect(findFirst).not.toHaveBeenCalled();
    });

    it('resolves actor from test headers with default roles', async () => {
      const actor = await resolveActor(new Headers({ 'x-user-id': 'test-user-1' }));

      expect(actor).toEqual({
        userId: 'test-user-1',
        status: 'ACTIVE',
        roles: ['freelancer', 'client'],
        permissions: ['jobs:create', 'proposals:create'],
      });
    });

    it('allows specifying custom roles via x-user-role in test environment', async () => {
      const actor = await resolveActor(
        new Headers({
          'x-user-id': 'admin-user-1',
          'x-user-role': 'admin',
        }),
      );

      expect(actor).toEqual({
        userId: 'admin-user-1',
        status: 'ACTIVE',
        roles: ['admin'],
        permissions: ['jobs:create', 'proposals:create'],
      });
    });

    it('throws AccountSuspendedError for suspended session user', async () => {
      findFirst.mockResolvedValue({
        id: 'sess-1',
        user: {
          id: 'user-suspended',
          status: 'SUSPENDED',
          userRoles: [],
        },
      });

      await expect(
        resolveActor(new Headers({ cookie: 'devforge_session=some-token' })),
      ).rejects.toThrow(AccountSuspendedError);
    });
  });

  describe('requireSession', () => {
    it('returns actor when authenticated via test headers', async () => {
      const actor = await requireSession(new Headers({ 'x-user-id': 'user-123' }));
      expect(actor.userId).toBe('user-123');
    });

    it('throws UnauthorizedError (401 DomainError) when not authenticated', async () => {
      await expect(requireSession(new Headers())).rejects.toThrow(UnauthorizedError);
      await expect(requireSession(new Headers())).rejects.toThrow(DomainError);
      try {
        await requireSession(new Headers());
      } catch (err: unknown) {
        expect((err as DomainError).statusCode).toBe(401);
      }
    });
  });

  describe('requireRole', () => {
    it('passes when actor possesses the required role', async () => {
      const headers = new Headers({ 'x-user-id': 'admin-1', 'x-user-role': 'admin' });
      const actor = await requireRole('admin', headers);
      expect(actor.userId).toBe('admin-1');
      expect(actor.roles).toContain('admin');
    });

    it('throws ForbiddenError (403 DomainError) when actor lacks the required role', async () => {
      const headers = new Headers({ 'x-user-id': 'user-1', 'x-user-role': 'freelancer' });
      await expect(requireRole('admin', headers)).rejects.toThrow(ForbiddenError);
      await expect(requireRole('admin', headers)).rejects.toThrow(DomainError);
      try {
        await requireRole('admin', headers);
      } catch (err: unknown) {
        expect((err as DomainError).statusCode).toBe(403);
      }
    });

    it('throws UnauthorizedError (401 DomainError) when no session exists', async () => {
      await expect(requireRole('admin', new Headers())).rejects.toThrow(UnauthorizedError);
    });
  });
});
