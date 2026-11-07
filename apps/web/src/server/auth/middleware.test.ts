import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock('@devforge/database', () => ({
  prisma: { session: { findFirst } },
}));

import { resolveActor } from './middleware';
import { hashSessionToken } from './session';

describe('resolveActor', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    findFirst.mockReset();
    findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

    const actor = await resolveActor(new Headers({ 'x-user-id': 'arbitrary-user-id' }));

    expect(actor).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });
});
