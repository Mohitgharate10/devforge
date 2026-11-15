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

describe('POST /api/v1/proposals/:proposalId/reject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const request = new Request('http://localhost/api/v1/proposals/prop-1/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: 'Selected another candidate.',
      }),
    });
    const params = Promise.resolve({ proposalId: 'prop-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 403 when user is not the job client', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValueOnce({
      id: 'prop-1',
      status: 'SUBMITTED',
      job: {
        clientProfile: { userId: 'real-client-user-id' },
      },
    });

    const request = new Request('http://localhost/api/v1/proposals/prop-1/reject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'random-intruder-id',
      },
      body: JSON.stringify({
        reason: 'Attempting unauthorized rejection.',
      }),
    });
    const params = Promise.resolve({ proposalId: 'prop-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('returns 200 when called by the job client', async () => {
    const clientUserId = 'real-client-user-id';
    mockPrisma.proposal.findUnique.mockResolvedValueOnce({
      id: 'prop-1',
      status: 'SUBMITTED',
      job: {
        clientProfile: { userId: clientUserId },
      },
    });
    mockPrisma.proposal.update.mockResolvedValueOnce({
      id: 'prop-1',
      status: 'REJECTED',
      updatedAt: new Date(),
    });

    const request = new Request('http://localhost/api/v1/proposals/prop-1/reject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': clientUserId,
      },
      body: JSON.stringify({
        reason: 'Selected another candidate.',
      }),
    });
    const params = Promise.resolve({ proposalId: 'prop-1' });

    const res = await POST(request, { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('REJECTED');
  });
});
