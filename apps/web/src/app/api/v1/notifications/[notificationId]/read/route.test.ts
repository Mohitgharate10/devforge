import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  notification: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  session: {
    findFirst: vi.fn(),
  },
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

import { PATCH } from './route';

describe('PATCH /api/v1/notifications/[notificationId]/read', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.notification.findUnique.mockReset();
    mockPrisma.notification.update.mockReset();
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when no session is provided', async () => {
      const request = new Request('http://localhost/api/v1/notifications/notif-1/read', {
        method: 'PATCH',
      });
      const params = Promise.resolve({ notificationId: 'notif-1' });

      const response = await PATCH(request, { params });
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 when a non-owner attempts to mark a DB notification as read', async () => {
      mockPrisma.notification.findUnique.mockResolvedValueOnce({
        id: 'notif-db-1',
        userId: 'owner-user-id',
        isRead: false,
      });

      const request = new Request('http://localhost/api/v1/notifications/notif-db-1/read', {
        method: 'PATCH',
        headers: {
          'x-user-id': 'different-user-id',
        },
      });
      const params = Promise.resolve({ notificationId: 'notif-db-1' });

      const response = await PATCH(request, { params });
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('FORBIDDEN');
      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });

    it('returns 200 when the owner marks a DB notification as read', async () => {
      const ownerId = 'owner-user-id';
      mockPrisma.notification.findUnique.mockResolvedValueOnce({
        id: 'notif-db-1',
        userId: ownerId,
        isRead: false,
      });
      mockPrisma.notification.update.mockResolvedValueOnce({
        id: 'notif-db-1',
        isRead: true,
      });

      const request = new Request('http://localhost/api/v1/notifications/notif-db-1/read', {
        method: 'PATCH',
        headers: {
          'x-user-id': ownerId,
        },
      });
      const params = Promise.resolve({ notificationId: 'notif-db-1' });

      const response = await PATCH(request, { params });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.data.id).toBe('notif-db-1');
      expect(body.data.isRead).toBe(true);
      expect(body.data.isLocalDemo).toBe(false);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-db-1' },
        data: expect.objectContaining({ isRead: true }),
      });
    });
  });

  describe('Demo store fallback', () => {
    it('returns 403 when a non-owner attempts to mark a demo notification as read', async () => {
      // Simulate DB offline or not found in DB
      mockPrisma.notification.findUnique.mockRejectedValueOnce(new Error('DB offline'));

      // In demoStore, 'notif-1' belongs to 'user-elena'
      const request = new Request('http://localhost/api/v1/notifications/notif-1/read', {
        method: 'PATCH',
        headers: {
          'x-user-id': 'attacker-user-id',
        },
      });
      const params = Promise.resolve({ notificationId: 'notif-1' });

      const response = await PATCH(request, { params });
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 when the owner marks a demo notification as read', async () => {
      mockPrisma.notification.findUnique.mockRejectedValueOnce(new Error('DB offline'));

      // 'notif-1' belongs to 'user-elena'
      const request = new Request('http://localhost/api/v1/notifications/notif-1/read', {
        method: 'PATCH',
        headers: {
          'x-user-id': 'user-elena',
        },
      });
      const params = Promise.resolve({ notificationId: 'notif-1' });

      const response = await PATCH(request, { params });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.data.id).toBe('notif-1');
      expect(body.data.isRead).toBe(true);
      expect(body.data.isLocalDemo).toBe(true);
    });

    it('returns 404 when notification is not found in DB or demo store', async () => {
      mockPrisma.notification.findUnique.mockResolvedValueOnce(null);

      const request = new Request('http://localhost/api/v1/notifications/non-existent-id/read', {
        method: 'PATCH',
        headers: {
          'x-user-id': 'user-elena',
        },
      });
      const params = Promise.resolve({ notificationId: 'non-existent-id' });

      const response = await PATCH(request, { params });
      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});
