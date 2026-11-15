import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  contract: {
    findUnique: vi.fn(),
  },
  session: {
    findFirst: vi.fn(),
  },
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

import { GET } from './route';

describe('GET /api/v1/contracts/:contractId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.contract.findUnique.mockReset();
  });

  it('returns 401 when no session is provided', async () => {
    const request = new Request('http://localhost/api/v1/contracts/contract-1');
    const params = Promise.resolve({ contractId: 'contract-1' });

    const response = await GET(request, { params });
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 403 when caller is not a party and not an admin (DB)', async () => {
    mockPrisma.contract.findUnique.mockResolvedValueOnce({
      id: 'contract-1',
      jobId: 'job-1',
      proposalId: 'prop-1',
      title: 'Solidity Audit',
      totalAmount: BigInt(5000),
      currency: 'USDC',
      status: 'ACTIVE',
      clientProfile: {
        id: 'cp-1',
        userId: 'client-id',
        organizationName: 'Client Inc',
        slug: 'client',
      },
      freelancerProfile: {
        id: 'fp-1',
        userId: 'freelancer-id',
        handle: 'freelancer',
        title: 'Researcher',
        user: { displayName: 'Freelancer Dev' },
      },
      milestones: [],
      participants: [
        { userId: 'client-id', role: 'CLIENT' },
        { userId: 'freelancer-id', role: 'FREELANCER' },
      ],
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    });

    const request = new Request('http://localhost/api/v1/contracts/contract-1', {
      headers: {
        'x-user-id': 'unrelated-user',
      },
    });
    const params = Promise.resolve({ contractId: 'contract-1' });

    const response = await GET(request, { params });
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 200 when caller is the client on the contract (DB)', async () => {
    mockPrisma.contract.findUnique.mockResolvedValueOnce({
      id: 'contract-1',
      jobId: 'job-1',
      proposalId: 'prop-1',
      title: 'Solidity Audit',
      totalAmount: BigInt(5000),
      currency: 'USDC',
      status: 'ACTIVE',
      clientProfile: {
        id: 'cp-1',
        userId: 'client-id',
        organizationName: 'Client Inc',
        slug: 'client',
      },
      freelancerProfile: {
        id: 'fp-1',
        userId: 'freelancer-id',
        handle: 'freelancer',
        title: 'Researcher',
        user: { displayName: 'Freelancer Dev' },
      },
      milestones: [],
      participants: [
        { userId: 'client-id', role: 'CLIENT' },
        { userId: 'freelancer-id', role: 'FREELANCER' },
      ],
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    });

    const request = new Request('http://localhost/api/v1/contracts/contract-1', {
      headers: {
        'x-user-id': 'client-id',
      },
    });
    const params = Promise.resolve({ contractId: 'contract-1' });

    const response = await GET(request, { params });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.id).toBe('contract-1');
    expect(body.data.title).toBe('Solidity Audit');
  });

  it('returns 200 when caller is the freelancer on the contract (DB)', async () => {
    mockPrisma.contract.findUnique.mockResolvedValueOnce({
      id: 'contract-1',
      jobId: 'job-1',
      proposalId: 'prop-1',
      title: 'Solidity Audit',
      totalAmount: BigInt(5000),
      currency: 'USDC',
      status: 'ACTIVE',
      clientProfile: {
        id: 'cp-1',
        userId: 'client-id',
        organizationName: 'Client Inc',
        slug: 'client',
      },
      freelancerProfile: {
        id: 'fp-1',
        userId: 'freelancer-id',
        handle: 'freelancer',
        title: 'Researcher',
        user: { displayName: 'Freelancer Dev' },
      },
      milestones: [],
      participants: [
        { userId: 'client-id', role: 'CLIENT' },
        { userId: 'freelancer-id', role: 'FREELANCER' },
      ],
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    });

    const request = new Request('http://localhost/api/v1/contracts/contract-1', {
      headers: {
        'x-user-id': 'freelancer-id',
      },
    });
    const params = Promise.resolve({ contractId: 'contract-1' });

    const response = await GET(request, { params });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.id).toBe('contract-1');
  });

  it('returns 200 when caller is an admin (even if not party to the contract)', async () => {
    mockPrisma.contract.findUnique.mockResolvedValueOnce({
      id: 'contract-1',
      jobId: 'job-1',
      proposalId: 'prop-1',
      title: 'Solidity Audit',
      totalAmount: BigInt(5000),
      currency: 'USDC',
      status: 'ACTIVE',
      clientProfile: {
        id: 'cp-1',
        userId: 'client-id',
        organizationName: 'Client Inc',
        slug: 'client',
      },
      freelancerProfile: {
        id: 'fp-1',
        userId: 'freelancer-id',
        handle: 'freelancer',
        title: 'Researcher',
        user: { displayName: 'Freelancer Dev' },
      },
      milestones: [],
      participants: [
        { userId: 'client-id', role: 'CLIENT' },
        { userId: 'freelancer-id', role: 'FREELANCER' },
      ],
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    });

    const request = new Request('http://localhost/api/v1/contracts/contract-1', {
      headers: {
        'x-user-id': 'admin-user-id',
        'x-user-role': 'admin',
      },
    });
    const params = Promise.resolve({ contractId: 'contract-1' });

    const response = await GET(request, { params });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.id).toBe('contract-1');
  });

  it('returns 404 when contract does not exist', async () => {
    mockPrisma.contract.findUnique.mockResolvedValueOnce(null);

    const request = new Request('http://localhost/api/v1/contracts/non-existent', {
      headers: {
        'x-user-id': 'client-id',
      },
    });
    const params = Promise.resolve({ contractId: 'non-existent' });

    const response = await GET(request, { params });
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
