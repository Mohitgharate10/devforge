import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  notification: {
    updateMany: vi.fn(),
  },
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

import { POST } from './route';

describe('POST /api/v1/notifications/read-all', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const request = new Request('http://localhost/api/v1/notifications/read-all', {
      method: 'POST',
    });

    const res = await POST(request);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 200 when authenticated and marks notifications read for the user', async () => {
    mockPrisma.notification.updateMany.mockResolvedValueOnce({ count: 5 });

    const request = new Request('http://localhost/api/v1/notifications/read-all', {
      method: 'POST',
      headers: {
        'x-user-id': 'user-123',
      },
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.success).toBe(true);
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-123', isRead: false },
      data: expect.objectContaining({ isRead: true }),
    });
  });
});
