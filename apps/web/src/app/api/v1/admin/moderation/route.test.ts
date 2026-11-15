import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  reportFindMany: vi.fn(),
  reportUpdate: vi.fn(),
  sessionFindFirst: vi.fn(),
}));

vi.mock('@devforge/database', () => ({
  prisma: {
    report: {
      findMany: database.reportFindMany,
      update: database.reportUpdate,
    },
    session: {
      findFirst: database.sessionFindFirst,
    },
  },
}));

import { GET, PATCH } from './route';

describe('/api/v1/admin/moderation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.sessionFindFirst.mockResolvedValue(null);
  });

  describe('GET', () => {
    it('returns 401 UNAUTHENTICATED when called without a session', async () => {
      const request = new Request('http://localhost/api/v1/admin/moderation', {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 FORBIDDEN when called by a non-admin user', async () => {
      const request = new Request('http://localhost/api/v1/admin/moderation', {
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

    it('returns 200 with reports when called by an admin', async () => {
      const mockReports = [
        {
          id: 'report-1',
          reporterId: '00000000-0000-4000-a000-000000000002',
          targetType: 'JOB',
          targetId: 'job-1',
          reason: 'Spam listing',
          status: 'PENDING',
          severity: 'LOW',
          createdAt: new Date(),
        },
      ];
      database.reportFindMany.mockResolvedValue(mockReports);

      const request = new Request('http://localhost/api/v1/admin/moderation', {
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
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0].id).toBe('report-1');
    });
  });

  describe('PATCH', () => {
    it('returns 401 UNAUTHENTICATED when called without a session', async () => {
      const request = new Request('http://localhost/api/v1/admin/moderation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: 'report-1',
          status: 'RESOLVED',
        }),
      });

      const response = await PATCH(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 FORBIDDEN when called by a non-admin user', async () => {
      const request = new Request('http://localhost/api/v1/admin/moderation', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '00000000-0000-4000-a000-000000000001',
          'x-user-role': 'client',
        },
        body: JSON.stringify({
          reportId: 'report-1',
          status: 'RESOLVED',
        }),
      });

      const response = await PATCH(request);
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 when updating report status as admin', async () => {
      const updatedReport = {
        id: 'report-1',
        reporterId: '00000000-0000-4000-a000-000000000002',
        targetType: 'JOB',
        targetId: 'job-1',
        reason: 'Spam listing',
        status: 'RESOLVED',
        severity: 'LOW',
        createdAt: new Date(),
      };
      database.reportUpdate.mockResolvedValue(updatedReport);

      const request = new Request('http://localhost/api/v1/admin/moderation', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '00000000-0000-4000-a000-000000000099',
          'x-user-role': 'admin',
        },
        body: JSON.stringify({
          reportId: 'report-1',
          status: 'RESOLVED',
        }),
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.status).toBe('RESOLVED');
    });

    it('returns 400 VALIDATION_FAILED on invalid request body', async () => {
      const request = new Request('http://localhost/api/v1/admin/moderation', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '00000000-0000-4000-a000-000000000099',
          'x-user-role': 'admin',
        },
        body: JSON.stringify({
          reportId: 'report-1',
          status: 'INVALID_STATUS',
        }),
      });

      const response = await PATCH(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe('VALIDATION_FAILED');
    });
  });
});
