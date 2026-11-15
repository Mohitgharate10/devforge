import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  proposal: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

import { POST } from './route';

describe('POST /api/v1/proposals/:proposalId/withdraw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const request = new Request('http://localhost/api/v1/proposals/prop-1/withdraw', {
      method: 'POST',
    });
    const params = Promise.resolve({ proposalId: 'prop-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 403 when caller is not the freelancer who submitted the proposal', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValueOnce({
      id: 'prop-1',
      status: 'SUBMITTED',
      freelancerProfile: { userId: 'real-author-id' },
    });

    const request = new Request('http://localhost/api/v1/proposals/prop-1/withdraw', {
      method: 'POST',
      headers: {
        'x-user-id': 'intruder-id',
      },
    });
    const params = Promise.resolve({ proposalId: 'prop-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('returns 200 when caller is the proposal submitter', async () => {
    const authorId = 'real-author-id';
    mockPrisma.proposal.findUnique.mockResolvedValueOnce({
      id: 'prop-1',
      status: 'SUBMITTED',
      freelancerProfile: { userId: authorId },
    });
    mockPrisma.proposal.update.mockResolvedValueOnce({
      id: 'prop-1',
      status: 'WITHDRAWN',
      updatedAt: new Date(),
    });

    const request = new Request('http://localhost/api/v1/proposals/prop-1/withdraw', {
      method: 'POST',
      headers: {
        'x-user-id': authorId,
      },
    });
    const params = Promise.resolve({ proposalId: 'prop-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('WITHDRAWN');
  });
});
