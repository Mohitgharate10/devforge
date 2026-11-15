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

import { GET, PATCH } from './route';

describe('/api/v1/proposals/:proposalId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      const request = new Request('http://localhost/api/v1/proposals/prop-1', {
        method: 'GET',
      });
      const params = Promise.resolve({ proposalId: 'prop-1' });

      const res = await GET(request, { params });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 when user is neither proposal freelancer nor job client', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 'prop-1',
        jobId: 'job-1',
        freelancerProfileId: 'fp-1',
        freelancerProfile: {
          id: 'fp-1',
          userId: 'freelancer-user-1',
          handle: 'freelancer',
          title: 'Dev',
          user: { displayName: 'Freelancer', avatarUrl: null },
        },
        job: {
          id: 'job-1',
          title: 'Job 1',
          clientProfile: { userId: 'client-user-1' },
        },
      });

      const request = new Request('http://localhost/api/v1/proposals/prop-1', {
        method: 'GET',
        headers: {
          'x-user-id': 'unrelated-user',
        },
      });
      const params = Promise.resolve({ proposalId: 'prop-1' });

      const res = await GET(request, { params });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 when called by the proposal freelancer', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 'prop-1',
        jobId: 'job-1',
        freelancerProfileId: 'fp-1',
        freelancerProfile: {
          id: 'fp-1',
          userId: 'freelancer-user-1',
          handle: 'freelancer',
          title: 'Dev',
          user: { displayName: 'Freelancer', avatarUrl: null },
        },
        job: {
          id: 'job-1',
          title: 'Job 1',
          clientProfile: { userId: 'client-user-1' },
        },
        coverLetter: 'I will build this.',
        bidAmount: BigInt(5000),
        currency: 'USDC',
        status: 'SUBMITTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/v1/proposals/prop-1', {
        method: 'GET',
        headers: {
          'x-user-id': 'freelancer-user-1',
        },
      });
      const params = Promise.resolve({ proposalId: 'prop-1' });

      const res = await GET(request, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe('prop-1');
    });

    it('returns 200 when called by the job client', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 'prop-1',
        jobId: 'job-1',
        freelancerProfileId: 'fp-1',
        freelancerProfile: {
          id: 'fp-1',
          userId: 'freelancer-user-1',
          handle: 'freelancer',
          title: 'Dev',
          user: { displayName: 'Freelancer', avatarUrl: null },
        },
        job: {
          id: 'job-1',
          title: 'Job 1',
          clientProfile: { userId: 'client-user-1' },
        },
        coverLetter: 'I will build this.',
        bidAmount: BigInt(5000),
        currency: 'USDC',
        status: 'SUBMITTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost/api/v1/proposals/prop-1', {
        method: 'GET',
        headers: {
          'x-user-id': 'client-user-1',
        },
      });
      const params = Promise.resolve({ proposalId: 'prop-1' });

      const res = await GET(request, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe('prop-1');
    });
  });

  describe('PATCH', () => {
    it('returns 401 when unauthenticated', async () => {
      const request = new Request('http://localhost/api/v1/proposals/prop-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetter: 'Updated cover letter with more details.',
        }),
      });
      const params = Promise.resolve({ proposalId: 'prop-1' });

      const res = await PATCH(request, { params });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 when caller is not the freelancer who submitted the proposal', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 'prop-1',
        freelancerProfile: { userId: 'freelancer-author-id' },
        status: 'SUBMITTED',
      });

      const request = new Request('http://localhost/api/v1/proposals/prop-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'intruder-id',
        },
        body: JSON.stringify({
          coverLetter: 'Attempting unauthorized edit on proposal.',
        }),
      });
      const params = Promise.resolve({ proposalId: 'prop-1' });

      const res = await PATCH(request, { params });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 when author updates their proposal', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 'prop-1',
        freelancerProfile: { userId: 'freelancer-author-id' },
        status: 'SUBMITTED',
      });
      mockPrisma.proposal.update.mockResolvedValueOnce({
        id: 'prop-1',
        jobId: 'job-1',
        freelancerProfileId: 'fp-1',
        coverLetter: 'Updated cover letter with technical specifications.',
        bidAmount: BigInt(6000),
        currency: 'USDC',
        status: 'SUBMITTED',
        createdAt: new Date(),
        updatedAt: new Date(),
        job: { title: 'Smart Contract Audit' },
        freelancerProfile: { user: { displayName: 'Author', avatarUrl: null } },
      });

      const request = new Request('http://localhost/api/v1/proposals/prop-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'freelancer-author-id',
        },
        body: JSON.stringify({
          coverLetter: 'Updated cover letter with technical specifications.',
          bidAmount: 6000,
        }),
      });
      const params = Promise.resolve({ proposalId: 'prop-1' });

      const res = await PATCH(request, { params });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.bidAmount).toBe(6000);
    });
  });
});
