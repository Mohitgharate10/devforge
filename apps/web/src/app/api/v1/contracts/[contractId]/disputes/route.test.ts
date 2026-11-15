import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  contract: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

import { POST } from './route';

describe('POST /api/v1/contracts/:contractId/disputes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const request = new Request('http://localhost/api/v1/contracts/c-1/disputes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: 'Deliverable does not meet technical specification requirements.',
      }),
    });
    const params = Promise.resolve({ contractId: 'c-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 403 when user is neither client nor freelancer on the contract', async () => {
    mockPrisma.contract.findUnique.mockResolvedValueOnce({
      id: 'c-1',
      status: 'ACTIVE',
      clientProfile: { userId: 'client-user-1' },
      freelancerProfile: { userId: 'freelancer-user-1' },
      participants: [
        { userId: 'client-user-1', role: 'CLIENT' },
        { userId: 'freelancer-user-1', role: 'FREELANCER' },
      ],
    });

    const request = new Request('http://localhost/api/v1/contracts/c-1/disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'unrelated-user',
      },
      body: JSON.stringify({
        reason: 'Attempting unauthorized dispute opening on contract.',
      }),
    });
    const params = Promise.resolve({ contractId: 'c-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('returns 200 when contract client opens a dispute', async () => {
    mockPrisma.contract.findUnique.mockResolvedValueOnce({
      id: 'c-1',
      status: 'ACTIVE',
      clientProfile: { userId: 'client-user-1' },
      freelancerProfile: { userId: 'freelancer-user-1' },
      participants: [
        { userId: 'client-user-1', role: 'CLIENT' },
        { userId: 'freelancer-user-1', role: 'FREELANCER' },
      ],
    });
    mockPrisma.contract.update.mockResolvedValueOnce({
      id: 'c-1',
      status: 'DISPUTED',
      updatedAt: new Date(),
    });

    const request = new Request('http://localhost/api/v1/contracts/c-1/disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'client-user-1',
      },
      body: JSON.stringify({
        reason: 'Deliverable does not meet technical specification requirements.',
      }),
    });
    const params = Promise.resolve({ contractId: 'c-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('DISPUTED');
  });

  it('returns 200 when contract freelancer opens a dispute', async () => {
    mockPrisma.contract.findUnique.mockResolvedValueOnce({
      id: 'c-1',
      status: 'ACTIVE',
      clientProfile: { userId: 'client-user-1' },
      freelancerProfile: { userId: 'freelancer-user-1' },
      participants: [
        { userId: 'client-user-1', role: 'CLIENT' },
        { userId: 'freelancer-user-1', role: 'FREELANCER' },
      ],
    });
    mockPrisma.contract.update.mockResolvedValueOnce({
      id: 'c-1',
      status: 'DISPUTED',
      updatedAt: new Date(),
    });

    const request = new Request('http://localhost/api/v1/contracts/c-1/disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'freelancer-user-1',
      },
      body: JSON.stringify({
        reason: 'Client has been unresponsive regarding deliverable feedback.',
      }),
    });
    const params = Promise.resolve({ contractId: 'c-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('DISPUTED');
  });
});
