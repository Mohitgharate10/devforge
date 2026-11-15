import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  milestone: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  delivery: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
  session: {
    findFirst: vi.fn(),
  },
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

import { POST } from './route';

describe('POST /api/v1/milestones/:milestoneId/deliveries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.milestone.findUnique.mockReset();
    mockPrisma.milestone.update.mockReset();
    mockPrisma.delivery.create.mockReset();
    mockPrisma.$transaction.mockReset();
  });

  it('returns 401 when no session is provided', async () => {
    const request = new Request('http://localhost/api/v1/milestones/ms-1/deliveries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Completed the milestone work deliverable.',
      }),
    });
    const params = Promise.resolve({ milestoneId: 'ms-1' });

    const response = await POST(request, { params });
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 403 when caller is not the freelancer on the contract (DB)', async () => {
    mockPrisma.milestone.findUnique.mockResolvedValueOnce({
      id: 'ms-1',
      status: 'FUNDED',
      contract: {
        freelancerProfileId: 'fp-1',
        freelancerProfile: { userId: 'freelancer-user-id' },
        participants: [
          { userId: 'client-user-id', role: 'CLIENT' },
          { userId: 'freelancer-user-id', role: 'FREELANCER' },
        ],
      },
    });

    const request = new Request('http://localhost/api/v1/milestones/ms-1/deliveries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'client-user-id', // client, not freelancer!
      },
      body: JSON.stringify({
        description: 'Attempting unauthorized submission.',
      }),
    });
    const params = Promise.resolve({ milestoneId: 'ms-1' });

    const response = await POST(request, { params });
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 201 when caller is the contract freelancer (DB)', async () => {
    const freelancerUserId = 'freelancer-user-id';
    mockPrisma.milestone.findUnique.mockResolvedValueOnce({
      id: 'ms-1',
      status: 'FUNDED',
      contract: {
        freelancerProfileId: 'fp-1',
        freelancerProfile: { userId: freelancerUserId },
        participants: [
          { userId: 'client-user-id', role: 'CLIENT' },
          { userId: freelancerUserId, role: 'FREELANCER' },
        ],
      },
    });

    const createdDelivery = {
      id: 'del-1',
      milestoneId: 'ms-1',
      freelancerProfileId: 'fp-1',
      description: 'Completed the milestone work deliverable.',
      status: 'SUBMITTED',
      feedback: null,
      submittedAt: new Date('2026-02-01T00:00:00Z'),
    };

    mockPrisma.$transaction.mockImplementationOnce(
      async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return cb(mockPrisma);
      },
    );
    mockPrisma.delivery.create.mockResolvedValueOnce(createdDelivery);
    mockPrisma.milestone.update.mockResolvedValueOnce({ id: 'ms-1', status: 'SUBMITTED' });

    const request = new Request('http://localhost/api/v1/milestones/ms-1/deliveries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': freelancerUserId,
      },
      body: JSON.stringify({
        description: 'Completed the milestone work deliverable.',
      }),
    });
    const params = Promise.resolve({ milestoneId: 'ms-1' });

    const response = await POST(request, { params });
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.data.id).toBe('del-1');
    expect(body.data.status).toBe('SUBMITTED');
  });

  it('returns 403 when non-freelancer submits to demo milestone', async () => {
    mockPrisma.milestone.findUnique.mockRejectedValueOnce(new Error('DB offline'));

    // In demo data, 'ms-bridge-1' belongs to 'contract-bridge-audit' where freelancer is 'user-elena'
    const request = new Request('http://localhost/api/v1/milestones/ms-bridge-1/deliveries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'unrelated-user',
      },
      body: JSON.stringify({
        description: 'Unauthorized demo delivery submission.',
      }),
    });
    const params = Promise.resolve({ milestoneId: 'ms-bridge-1' });

    const response = await POST(request, { params });
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 201 when freelancer submits to demo milestone', async () => {
    mockPrisma.milestone.findUnique.mockRejectedValueOnce(new Error('DB offline'));

    // 'user-elena' is freelancer for 'ms-bridge-1'
    const request = new Request('http://localhost/api/v1/milestones/ms-bridge-1/deliveries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user-elena',
      },
      body: JSON.stringify({
        description: 'Elena submitted the demo deliverable.',
      }),
    });
    const params = Promise.resolve({ milestoneId: 'ms-bridge-1' });

    const response = await POST(request, { params });
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.data.description).toBe('Elena submitted the demo deliverable.');
    expect(body.data.isLocalDemo).toBe(true);
  });
});
