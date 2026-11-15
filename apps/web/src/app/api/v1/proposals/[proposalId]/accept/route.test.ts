import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  proposal: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  job: {
    update: vi.fn(),
  },
  contract: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

import { POST } from './route';

describe('POST /api/v1/proposals/:proposalId/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const request = new Request('http://localhost/api/v1/proposals/prop-1/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        milestones: [{ title: 'Milestone 1', amount: 5000 }],
      }),
    });
    const params = Promise.resolve({ proposalId: 'prop-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 403 when caller is not the job client', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValueOnce({
      id: 'prop-1',
      jobId: 'job-1',
      bidAmount: BigInt(5000),
      currency: 'USDC',
      status: 'SUBMITTED',
      job: {
        id: 'job-1',
        title: 'Build Protocol',
        clientProfileId: 'cp-1',
        clientProfile: { userId: 'real-client-id' },
      },
      freelancerProfileId: 'fp-1',
      freelancerProfile: {
        userId: 'freelancer-id',
        user: { displayName: 'Dev' },
      },
    });

    const request = new Request('http://localhost/api/v1/proposals/prop-1/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'unrelated-user-id',
      },
      body: JSON.stringify({
        milestones: [{ title: 'Milestone 1', amount: 5000 }],
      }),
    });
    const params = Promise.resolve({ proposalId: 'prop-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('returns 201 when called by the job client', async () => {
    const clientUserId = 'real-client-id';
    mockPrisma.proposal.findUnique.mockResolvedValueOnce({
      id: 'prop-1',
      jobId: 'job-1',
      bidAmount: BigInt(5000),
      currency: 'USDC',
      status: 'SUBMITTED',
      job: {
        id: 'job-1',
        title: 'Build Protocol',
        clientProfileId: 'cp-1',
        clientProfile: { userId: clientUserId },
      },
      freelancerProfileId: 'fp-1',
      freelancerProfile: {
        userId: 'freelancer-id',
        user: { displayName: 'Dev' },
      },
    });

    mockPrisma.$transaction.mockImplementationOnce(async (cb) => {
      const tx = {
        proposal: { update: vi.fn() },
        job: { update: vi.fn() },
        contract: {
          create: vi.fn().mockResolvedValue({
            id: 'contract-created-1',
            jobId: 'job-1',
            proposalId: 'prop-1',
            title: 'Build Protocol',
            totalAmount: BigInt(5000),
            currency: 'USDC',
            status: 'ACTIVE',
            milestones: [{ id: 'ms-1' }],
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      };
      return await cb(tx);
    });

    const request = new Request('http://localhost/api/v1/proposals/prop-1/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': clientUserId,
      },
      body: JSON.stringify({
        milestones: [{ title: 'Milestone 1', amount: 5000 }],
      }),
    });
    const params = Promise.resolve({ proposalId: 'prop-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBe('contract-created-1');
  });
});
