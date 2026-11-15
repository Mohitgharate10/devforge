import { describe, expect, it, vi, beforeEach } from 'vitest';

const database = vi.hoisted(() => ({
  deliveryFindUnique: vi.fn(),
  deliveryUpdate: vi.fn(),
  milestoneUpdate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@devforge/database', () => ({
  prisma: {
    delivery: {
      findUnique: database.deliveryFindUnique,
      update: database.deliveryUpdate,
    },
    milestone: {
      update: database.milestoneUpdate,
    },
    $transaction: database.transaction,
  },
}));

import { POST } from './route';

type MockTx = {
  delivery: { update: ReturnType<typeof vi.fn> };
  milestone: { update: ReturnType<typeof vi.fn> };
};

describe('POST /api/v1/deliveries/:deliveryId/reject', () => {
  const deliveryId = 'del-123';
  const clientUserId = 'client-user-1';
  const otherUserId = 'freelancer-user-2';

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    database.deliveryFindUnique.mockReset();
    database.deliveryUpdate.mockReset();
    database.milestoneUpdate.mockReset();
    database.transaction.mockReset();

    database.deliveryFindUnique.mockResolvedValue({
      id: deliveryId,
      status: 'SUBMITTED',
      milestoneId: 'ms-1',
      milestone: {
        id: 'ms-1',
        status: 'SUBMITTED',
        contractId: 'contract-1',
        contract: {
          id: 'contract-1',
          clientProfile: {
            userId: clientUserId,
          },
        },
      },
    });

    database.transaction.mockImplementation(async (callback: (tx: MockTx) => Promise<unknown>) => {
      return callback({
        delivery: {
          update: vi.fn().mockResolvedValue({
            id: deliveryId,
            status: 'REJECTED',
            feedback: 'Please revise',
            reviewedAt: new Date('2026-11-15T12:00:00Z'),
          }),
        },
        milestone: {
          update: vi.fn().mockResolvedValue({ id: 'ms-1', status: 'IN_PROGRESS' }),
        },
      });
    });
  });

  it('returns 401 when no session is present', async () => {
    const request = new Request(`http://localhost/api/v1/deliveries/${deliveryId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: 'Please fix the invariant' }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ deliveryId }),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 403 when caller is not the contract client', async () => {
    const request = new Request(`http://localhost/api/v1/deliveries/${deliveryId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': otherUserId,
      },
      body: JSON.stringify({ feedback: 'Please fix the invariant' }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ deliveryId }),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 200 when caller is the correct client', async () => {
    const request = new Request(`http://localhost/api/v1/deliveries/${deliveryId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': clientUserId,
      },
      body: JSON.stringify({ feedback: 'Please revise' }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ deliveryId }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.id).toBe(deliveryId);
    expect(body.data.status).toBe('REJECTED');
  });
});
