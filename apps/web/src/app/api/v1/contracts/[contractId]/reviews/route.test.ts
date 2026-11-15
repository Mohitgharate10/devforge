import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  contract: {
    findUnique: vi.fn(),
  },
  review: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  session: {
    findFirst: vi.fn(),
  },
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from './route';

describe('/api/v1/contracts/:contractId/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.contract.findUnique.mockReset();
    mockPrisma.review.findMany.mockReset();
    mockPrisma.review.findFirst.mockReset();
    mockPrisma.review.create.mockReset();
  });

  describe('GET', () => {
    it('returns 401 when no session is provided', async () => {
      const request = new Request('http://localhost/api/v1/contracts/contract-1/reviews');
      const params = Promise.resolve({ contractId: 'contract-1' });

      const response = await GET(request, { params });
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 when caller is not client or freelancer on contract (DB)', async () => {
      mockPrisma.contract.findUnique.mockResolvedValueOnce({
        id: 'contract-1',
        clientProfile: { userId: 'client-id' },
        freelancerProfile: { userId: 'freelancer-id' },
        participants: [
          { userId: 'client-id', role: 'CLIENT' },
          { userId: 'freelancer-id', role: 'FREELANCER' },
        ],
      });

      const request = new Request('http://localhost/api/v1/contracts/contract-1/reviews', {
        headers: { 'x-user-id': 'unrelated-user' },
      });
      const params = Promise.resolve({ contractId: 'contract-1' });

      const response = await GET(request, { params });
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 when client accesses reviews (DB)', async () => {
      mockPrisma.contract.findUnique.mockResolvedValueOnce({
        id: 'contract-1',
        clientProfile: { userId: 'client-id' },
        freelancerProfile: { userId: 'freelancer-id' },
        participants: [
          { userId: 'client-id', role: 'CLIENT' },
          { userId: 'freelancer-id', role: 'FREELANCER' },
        ],
      });
      mockPrisma.review.findMany.mockResolvedValueOnce([
        {
          id: 'rev-1',
          contractId: 'contract-1',
          reviewerId: 'client-id',
          reviewer: { displayName: 'Client Org' },
          revieweeId: 'freelancer-id',
          rating: 5,
          comment: 'Great work!',
          createdAt: new Date('2026-02-01T00:00:00Z'),
        },
      ]);

      const request = new Request('http://localhost/api/v1/contracts/contract-1/reviews', {
        headers: { 'x-user-id': 'client-id' },
      });
      const params = Promise.resolve({ contractId: 'contract-1' });

      const response = await GET(request, { params });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe('rev-1');
    });

    it('returns 200 when freelancer accesses demo reviews', async () => {
      mockPrisma.contract.findUnique.mockRejectedValueOnce(new Error('DB offline'));

      // Demo contract 'contract-bridge-audit' has freelancer: 'user-elena'
      const request = new Request(
        'http://localhost/api/v1/contracts/contract-bridge-audit/reviews',
        {
          headers: { 'x-user-id': 'user-elena' },
        },
      );
      const params = Promise.resolve({ contractId: 'contract-bridge-audit' });

      const response = await GET(request, { params });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      const request = new Request('http://localhost/api/v1/contracts/contract-1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 5, feedback: 'Excellent delivery!' }),
      });
      const params = Promise.resolve({ contractId: 'contract-1' });

      const response = await POST(request, { params });
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 when non-party attempts to submit a review (DB)', async () => {
      mockPrisma.contract.findUnique.mockResolvedValueOnce({
        id: 'contract-1',
        clientProfile: { userId: 'client-id' },
        freelancerProfile: { userId: 'freelancer-id' },
        participants: [
          { userId: 'client-id', role: 'CLIENT' },
          { userId: 'freelancer-id', role: 'FREELANCER' },
        ],
      });

      const request = new Request('http://localhost/api/v1/contracts/contract-1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'intruder-id',
        },
        body: JSON.stringify({ rating: 5, feedback: 'Attempting review.' }),
      });
      const params = Promise.resolve({ contractId: 'contract-1' });

      const response = await POST(request, { params });
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('returns 400 when review data is invalid', async () => {
      const request = new Request('http://localhost/api/v1/contracts/contract-1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'client-id',
        },
        body: JSON.stringify({ rating: 10, feedback: 'Hi' }), // rating > 5, feedback < 5 chars
      });
      const params = Promise.resolve({ contractId: 'contract-1' });

      const response = await POST(request, { params });
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_FAILED');
    });

    it('returns 400 when contract is not completed (DB)', async () => {
      mockPrisma.contract.findUnique.mockResolvedValueOnce({
        id: 'contract-1',
        status: 'ACTIVE',
        clientProfile: { userId: 'client-id' },
        freelancerProfile: { userId: 'freelancer-id' },
        participants: [
          { userId: 'client-id', role: 'CLIENT' },
          { userId: 'freelancer-id', role: 'FREELANCER' },
        ],
      });

      const request = new Request('http://localhost/api/v1/contracts/contract-1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'client-id',
        },
        body: JSON.stringify({
          rating: 5,
          feedback: 'Completed review on active contract.',
        }),
      });
      const params = Promise.resolve({ contractId: 'contract-1' });

      const response = await POST(request, { params });
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error.code).toBe('STATE_TRANSITION_INVALID');
      expect(body.error.message).toContain('completed contracts');
    });

    it('returns 409 when client attempts to submit duplicate review (DB existing review)', async () => {
      mockPrisma.contract.findUnique.mockResolvedValueOnce({
        id: 'contract-1',
        status: 'COMPLETED',
        clientProfile: { userId: 'client-id' },
        freelancerProfile: { userId: 'freelancer-id' },
        participants: [
          { userId: 'client-id', role: 'CLIENT' },
          { userId: 'freelancer-id', role: 'FREELANCER' },
        ],
      });
      mockPrisma.review.findFirst.mockResolvedValueOnce({
        id: 'existing-rev',
        contractId: 'contract-1',
        reviewerId: 'client-id',
      });

      const request = new Request('http://localhost/api/v1/contracts/contract-1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'client-id',
        },
        body: JSON.stringify({
          rating: 5,
          feedback: 'Attempting duplicate review submission.',
        }),
      });
      const params = Promise.resolve({ contractId: 'contract-1' });

      const response = await POST(request, { params });
      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body.error.code).toBe('CONFLICT');
      expect(body.error.message).toContain('already submitted a review');
    });

    it('returns 409 when prisma.review.create throws P2002 unique constraint violation', async () => {
      mockPrisma.contract.findUnique.mockResolvedValueOnce({
        id: 'contract-1',
        status: 'COMPLETED',
        clientProfile: { userId: 'client-id' },
        freelancerProfile: { userId: 'freelancer-id' },
        participants: [
          { userId: 'client-id', role: 'CLIENT' },
          { userId: 'freelancer-id', role: 'FREELANCER' },
        ],
      });
      mockPrisma.review.findFirst.mockResolvedValueOnce(null);
      const uniqueError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
      mockPrisma.review.create.mockRejectedValueOnce(uniqueError);

      const request = new Request('http://localhost/api/v1/contracts/contract-1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'client-id',
        },
        body: JSON.stringify({
          rating: 5,
          feedback: 'Attempting review when race condition occurs.',
        }),
      });
      const params = Promise.resolve({ contractId: 'contract-1' });

      const response = await POST(request, { params });
      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body.error.code).toBe('CONFLICT');
    });

    it('derives reviewee server-side as the counterparty regardless of targetId in body', async () => {
      mockPrisma.contract.findUnique.mockResolvedValueOnce({
        id: 'contract-1',
        status: 'COMPLETED',
        clientProfile: { userId: 'client-id' },
        freelancerProfile: { userId: 'freelancer-id' },
        participants: [
          { userId: 'client-id', role: 'CLIENT' },
          { userId: 'freelancer-id', role: 'FREELANCER' },
        ],
      });
      mockPrisma.review.findFirst.mockResolvedValueOnce(null);
      mockPrisma.review.create.mockImplementationOnce((args) =>
        Promise.resolve({
          id: 'rev-safe-1',
          contractId: 'contract-1',
          reviewerId: 'client-id',
          revieweeId: args.data.revieweeId,
          rating: 5,
          comment: args.data.comment,
          reviewer: { displayName: 'Client Org' },
          createdAt: new Date('2026-02-01T00:00:00Z'),
        }),
      );

      const request = new Request('http://localhost/api/v1/contracts/contract-1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'client-id',
        },
        body: JSON.stringify({
          rating: 5,
          feedback: 'Targeting an arbitrary user should be prevented.',
          targetId: 'arbitrary-victim-user-id',
        }),
      });
      const params = Promise.resolve({ contractId: 'contract-1' });

      const response = await POST(request, { params });
      expect(response.status).toBe(200);

      // Verify that prisma.review.create received the contract's actual freelancer-id, NOT arbitrary-victim-user-id
      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reviewerId: 'client-id',
            revieweeId: 'freelancer-id',
          }),
        }),
      );
    });

    it('returns 200 when client submits a valid review on completed contract (DB)', async () => {
      mockPrisma.contract.findUnique.mockResolvedValueOnce({
        id: 'contract-1',
        status: 'COMPLETED',
        clientProfile: { userId: 'client-id' },
        freelancerProfile: { userId: 'freelancer-id' },
        participants: [
          { userId: 'client-id', role: 'CLIENT' },
          { userId: 'freelancer-id', role: 'FREELANCER' },
        ],
      });
      mockPrisma.review.findFirst.mockResolvedValueOnce(null);

      mockPrisma.review.create.mockResolvedValueOnce({
        id: 'rev-created',
        contractId: 'contract-1',
        reviewerId: 'client-id',
        reviewer: { displayName: 'Client Org' },
        revieweeId: 'freelancer-id',
        rating: 5,
        comment: 'Outstanding smart contract audit quality.',
        createdAt: new Date('2026-02-01T00:00:00Z'),
      });

      const request = new Request('http://localhost/api/v1/contracts/contract-1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'client-id',
        },
        body: JSON.stringify({
          rating: 5,
          feedback: 'Outstanding smart contract audit quality.',
          targetId: 'freelancer-id',
        }),
      });
      const params = Promise.resolve({ contractId: 'contract-1' });

      const response = await POST(request, { params });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.data.id).toBe('rev-created');
      expect(body.data.rating).toBe(5);
    });
  });
});
