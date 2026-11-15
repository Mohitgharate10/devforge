import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  reportFindMany: vi.fn(),
  reportCreate: vi.fn(),
  sessionFindFirst: vi.fn(),
}));

vi.mock('@devforge/database', () => ({
  prisma: {
    report: {
      findMany: database.reportFindMany,
      create: database.reportCreate,
    },
    session: {
      findFirst: database.sessionFindFirst,
    },
  },
}));

import { GET, POST } from './route';

describe('/api/v1/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.sessionFindFirst.mockResolvedValue(null);
  });

  describe('GET', () => {
    it('returns 401 UNAUTHENTICATED when called without a session', async () => {
      const request = new Request('http://localhost/api/v1/reports', {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 FORBIDDEN when user account is suspended', async () => {
      database.sessionFindFirst.mockResolvedValue({
        id: 'session-1',
        tokenHash: 'some-hash',
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'user-suspended',
          status: 'SUSPENDED',
          userRoles: [],
        },
      });

      const request = new Request('http://localhost/api/v1/reports', {
        method: 'GET',
        headers: {
          cookie: 'devforge_session=test-token',
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('allows non-admin user to only see their own reports and never exposes other reporters IDs', async () => {
      const callerId = '00000000-0000-4000-a000-000000000001';
      const otherId = '00000000-0000-4000-a000-000000000002';

      database.reportFindMany.mockImplementation(async ({ where }) => {
        // Confirm Prisma is queried with callerId
        expect(where).toEqual({ reporterId: callerId });
        return [
          {
            id: 'rep-1',
            reporterId: callerId,
            targetType: 'JOB',
            targetId: 'job-1',
            reason: 'My own report',
            status: 'PENDING',
            severity: 'LOW',
            createdAt: new Date(),
          },
        ];
      });

      const request = new Request('http://localhost/api/v1/reports', {
        method: 'GET',
        headers: {
          'x-user-id': callerId,
          'x-user-role': 'freelancer',
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.length).toBe(1);
      expect(json.data[0].reporterId).toBe(callerId);
      // Ensure other reporter's ID is not present
      const hasOtherReporter = json.data.some(
        (r: { reporterId: string }) => r.reporterId === otherId,
      );
      expect(hasOtherReporter).toBe(false);
    });

    it('allows admin user to see all reports across different reporters', async () => {
      const adminId = '00000000-0000-4000-a000-000000000099';
      const reporterA = '00000000-0000-4000-a000-000000000001';
      const reporterB = '00000000-0000-4000-a000-000000000002';

      database.reportFindMany.mockImplementation(async ({ where }) => {
        // Admin query must not restrict where to a single reporterId
        expect(where).toEqual({});
        return [
          {
            id: 'rep-1',
            reporterId: reporterA,
            targetType: 'JOB',
            targetId: 'job-1',
            reason: 'Report by user A',
            status: 'PENDING',
            severity: 'LOW',
            createdAt: new Date(),
          },
          {
            id: 'rep-2',
            reporterId: reporterB,
            targetType: 'USER',
            targetId: 'user-3',
            reason: 'Report by user B',
            status: 'PENDING',
            severity: 'HIGH',
            createdAt: new Date(),
          },
        ];
      });

      const request = new Request('http://localhost/api/v1/reports', {
        method: 'GET',
        headers: {
          'x-user-id': adminId,
          'x-user-role': 'admin',
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.length).toBe(2);
      expect(json.data[0].reporterId).toBe(reporterA);
      expect(json.data[1].reporterId).toBe(reporterB);
    });
  });

  describe('POST', () => {
    it('creates a new report successfully', async () => {
      const targetId = '00000000-0000-4000-a000-000000000010';
      database.reportCreate.mockResolvedValue({
        id: 'rep-created',
        reporterId: '00000000-0000-0000-0000-000000000001',
        targetType: 'JOB',
        targetId,
        reason: '[SPAM] Suspicious job posting',
        status: 'PENDING',
        severity: 'MEDIUM',
        createdAt: new Date(),
      });

      const request = new Request('http://localhost/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'JOB',
          targetId,
          category: 'SPAM',
          reason: 'Suspicious job posting',
          severity: 'MEDIUM',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.id).toBe('rep-created');
    });
  });
});
