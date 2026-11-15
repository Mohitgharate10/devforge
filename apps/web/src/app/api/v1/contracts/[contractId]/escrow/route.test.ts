import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  contract: {
    findUnique: vi.fn(),
  },
  escrow: {
    findMany: vi.fn(),
  },
  session: {
    findFirst: vi.fn(),
  },
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

import { GET, POST } from './route';

describe('/api/v1/contracts/:contractId/escrow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.contract.findUnique.mockReset();
    mockPrisma.escrow.findMany.mockReset();
  });

  describe('POST', () => {
    it('refuses to create an escrow record without on-chain funding integration', async () => {
      const response = await POST(
        new Request('http://localhost/api/v1/contracts/contract-1/escrow', {
          method: 'POST',
          headers: { 'x-request-id': 'test-request' },
        }),
      );
      const payload = await response.json();

      expect(response.status).toBe(503);
      expect(payload.error.code).toBe('EXTERNAL_DEPENDENCY_FAILED');
      expect(payload.error.message).toMatch(/No funds or escrow record were created/);
    });
  });

  describe('GET - Authentication & Authorization', () => {
    it('returns 401 when no session is provided', async () => {
      const request = new Request('http://localhost/api/v1/contracts/contract-1/escrow');
      const params = Promise.resolve({ contractId: 'contract-1' });

      const response = await GET(request, { params });
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 when user is neither client nor freelancer on the contract (DB)', async () => {
      mockPrisma.contract.findUnique.mockResolvedValueOnce({
        id: 'contract-db-1',
        clientProfile: { userId: 'client-user-id' },
        freelancerProfile: { userId: 'freelancer-user-id' },
        participants: [
          { userId: 'client-user-id', role: 'CLIENT' },
          { userId: 'freelancer-user-id', role: 'FREELANCER' },
        ],
      });

      const request = new Request('http://localhost/api/v1/contracts/contract-db-1/escrow', {
        headers: {
          'x-user-id': 'random-observer-id',
        },
      });
      const params = Promise.resolve({ contractId: 'contract-db-1' });

      const response = await GET(request, { params });
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 when caller is the client on the contract (DB)', async () => {
      mockPrisma.contract.findUnique.mockResolvedValueOnce({
        id: 'contract-db-1',
        clientProfile: { userId: 'client-user-id' },
        freelancerProfile: { userId: 'freelancer-user-id' },
        participants: [
          { userId: 'client-user-id', role: 'CLIENT' },
          { userId: 'freelancer-user-id', role: 'FREELANCER' },
        ],
      });

      mockPrisma.escrow.findMany.mockResolvedValueOnce([
        {
          id: 'escrow-1',
          contractId: 'contract-db-1',
          milestoneId: 'ms-1',
          chainId: 11155111,
          status: 'HELD',
          amount: BigInt('1000000000000000000'),
          currency: 'ETH',
          funderAddress: '0x1111111111111111111111111111111111111111',
          recipientAddress: '0x2222222222222222222222222222222222222222',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          transactions: [{ txHash: '0xabc123' }],
        },
      ]);

      const request = new Request('http://localhost/api/v1/contracts/contract-db-1/escrow', {
        headers: {
          'x-user-id': 'client-user-id',
        },
      });
      const params = Promise.resolve({ contractId: 'contract-db-1' });

      const response = await GET(request, { params });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe('escrow-1');
      expect(body.data[0].status).toBe('DEPOSITED');
      expect(body.data[0].amount).toBe('1');
    });

    it('returns 200 when caller is the freelancer on the contract (DB)', async () => {
      mockPrisma.contract.findUnique.mockResolvedValueOnce({
        id: 'contract-db-1',
        clientProfile: { userId: 'client-user-id' },
        freelancerProfile: { userId: 'freelancer-user-id' },
        participants: [
          { userId: 'client-user-id', role: 'CLIENT' },
          { userId: 'freelancer-user-id', role: 'FREELANCER' },
        ],
      });

      mockPrisma.escrow.findMany.mockResolvedValueOnce([]);

      const request = new Request('http://localhost/api/v1/contracts/contract-db-1/escrow', {
        headers: {
          'x-user-id': 'freelancer-user-id',
        },
      });
      const params = Promise.resolve({ contractId: 'contract-db-1' });

      const response = await GET(request, { params });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns 404 when contract does not exist in DB or demo store', async () => {
      mockPrisma.contract.findUnique.mockResolvedValueOnce(null);

      const request = new Request(
        'http://localhost/api/v1/contracts/non-existent-contract/escrow',
        {
          headers: {
            'x-user-id': 'any-user-id',
          },
        },
      );
      const params = Promise.resolve({ contractId: 'non-existent-contract' });

      const response = await GET(request, { params });
      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET - Demo store fallback', () => {
    it('returns 403 when an unauthorized party accesses demo contract escrows', async () => {
      mockPrisma.contract.findUnique.mockRejectedValueOnce(new Error('DB offline'));

      // Demo contract 'contract-bridge-audit' has client: user-parity, freelancer: user-elena
      const request = new Request(
        'http://localhost/api/v1/contracts/contract-bridge-audit/escrow',
        {
          headers: {
            'x-user-id': 'unrelated-user',
          },
        },
      );
      const params = Promise.resolve({ contractId: 'contract-bridge-audit' });

      const response = await GET(request, { params });
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 when client accesses demo contract escrows', async () => {
      mockPrisma.contract.findUnique.mockRejectedValueOnce(new Error('DB offline'));

      const request = new Request(
        'http://localhost/api/v1/contracts/contract-bridge-audit/escrow',
        {
          headers: {
            'x-user-id': 'user-parity',
          },
        },
      );
      const params = Promise.resolve({ contractId: 'contract-bridge-audit' });

      const response = await GET(request, { params });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('returns 200 when freelancer accesses demo contract escrows', async () => {
      mockPrisma.contract.findUnique.mockRejectedValueOnce(new Error('DB offline'));

      const request = new Request(
        'http://localhost/api/v1/contracts/contract-bridge-audit/escrow',
        {
          headers: {
            'x-user-id': 'user-elena',
          },
        },
      );
      const params = Promise.resolve({ contractId: 'contract-bridge-audit' });

      const response = await GET(request, { params });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });
  });
});
