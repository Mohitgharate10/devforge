import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  contractCount: vi.fn(),
  escrowFindMany: vi.fn(),
  reportCount: vi.fn(),
  reviewFindMany: vi.fn(),
  userCount: vi.fn(),
  sessionFindFirst: vi.fn(),
}));

vi.mock('@devforge/database', () => ({
  prisma: {
    contract: { count: database.contractCount },
    escrow: { findMany: database.escrowFindMany },
    report: { count: database.reportCount },
    review: { findMany: database.reviewFindMany },
    user: { count: database.userCount },
    session: { findFirst: database.sessionFindFirst },
  },
}));

import { GET } from './route';

describe('/api/v1/admin/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.sessionFindFirst.mockResolvedValue(null);
    vi.stubEnv('DEMO_MODE', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 401 UNAUTHENTICATED when called without a session', async () => {
    const request = new Request('http://localhost/api/v1/admin/analytics', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 403 FORBIDDEN when called by a non-admin user', async () => {
    const request = new Request('http://localhost/api/v1/admin/analytics', {
      method: 'GET',
      headers: {
        'x-user-id': '00000000-0000-4000-a000-000000000001',
        'x-user-role': 'freelancer',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(403);

    const json = await response.json();
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('returns 200 with real platform analytics when called by an admin', async () => {
    database.contractCount.mockResolvedValue(5);
    database.escrowFindMany.mockResolvedValue([{ amount: '10.5' }, { amount: '2.5' }]);
    // reportCount called twice: for PENDING and RESOLVED
    database.reportCount.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    database.reviewFindMany.mockResolvedValue([{ rating: 5 }, { rating: 4 }]);
    database.userCount.mockResolvedValue(30);

    const request = new Request('http://localhost/api/v1/admin/analytics', {
      method: 'GET',
      headers: {
        'x-user-id': '00000000-0000-4000-a000-000000000099',
        'x-user-role': 'admin',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data).toBeDefined();
    expect(json.data.activeContractsCount).toBe(5);
    expect(json.data.totalEscrowVolumeEth).toBe(13);
    expect(json.data.totalDisputesCount).toBe(2);
    expect(json.data.resolvedDisputesCount).toBe(1);
    expect(json.data.averageRating).toBe(4.5);
    expect(json.data.totalUsersCount).toBe(30);
  });

  describe('Demo Mode Gating', () => {
    it('returns 500 when database fails and DEMO_MODE !== "true"', async () => {
      vi.stubEnv('DEMO_MODE', 'false');
      database.contractCount.mockRejectedValue(new Error('Database offline'));

      const request = new Request('http://localhost/api/v1/admin/analytics', {
        method: 'GET',
        headers: {
          'x-user-id': '00000000-0000-4000-a000-000000000099',
          'x-user-role': 'admin',
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.error.code).toBe('INTERNAL_ERROR');
      expect(json.error.message).toContain('Failed to retrieve analytics');
    });

    it('falls back to demoStore when database fails and DEMO_MODE === "true"', async () => {
      vi.stubEnv('DEMO_MODE', 'true');
      database.contractCount.mockRejectedValue(new Error('Database offline'));

      const request = new Request('http://localhost/api/v1/admin/analytics', {
        method: 'GET',
        headers: {
          'x-user-id': '00000000-0000-4000-a000-000000000099',
          'x-user-role': 'admin',
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(typeof json.data.activeContractsCount).toBe('number');
    });
  });
});
