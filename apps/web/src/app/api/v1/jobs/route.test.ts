import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  job: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  clientProfile: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  jobCategory: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  skill: {
    findFirst: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock('@devforge/database', () => ({
  prisma: mockPrisma,
}));

import { POST } from './route';

describe('POST /api/v1/jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const request = new Request('http://localhost/api/v1/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Build Substrate Bridge',
        description: 'Comprehensive cross-chain bridge implementation.',
        budgetMin: 5000,
        budgetMax: 10000,
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 403 when user is not a client or admin', async () => {
    const request = new Request('http://localhost/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'freelancer-1',
        'x-user-role': 'freelancer',
      },
      body: JSON.stringify({
        title: 'Build Substrate Bridge',
        description: 'Comprehensive cross-chain bridge implementation.',
        budgetMin: 5000,
        budgetMax: 10000,
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('returns 400 when budgetMin exceeds budgetMax', async () => {
    const request = new Request('http://localhost/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'client-1',
        'x-user-role': 'client',
      },
      body: JSON.stringify({
        title: 'Build Substrate Bridge',
        description: 'Comprehensive cross-chain bridge implementation.',
        budgetMin: 15000,
        budgetMax: 10000,
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when title or description is too short', async () => {
    const request = new Request('http://localhost/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'client-1',
        'x-user-role': 'client',
      },
      body: JSON.stringify({
        title: 'Tiny',
        description: 'Too short',
        budgetMin: 1000,
        budgetMax: 2000,
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns 201 when called with valid data by a client', async () => {
    mockPrisma.clientProfile.findUnique.mockResolvedValueOnce({
      id: 'cp-1',
      userId: 'client-1',
      organizationName: 'Web3 Protocol',
    });

    mockPrisma.jobCategory.findFirst.mockResolvedValueOnce({
      id: 'cat-1',
      name: 'Smart Contract Development',
      slug: 'smart-contract-development',
    });

    mockPrisma.skill.findFirst.mockResolvedValueOnce({
      id: 'skill-sol',
      name: 'Solidity',
      slug: 'solidity',
    });
    mockPrisma.skill.upsert.mockResolvedValueOnce({
      id: 'skill-sol',
      name: 'Solidity',
      slug: 'solidity',
    });

    mockPrisma.job.create.mockResolvedValueOnce({
      id: 'job-123',
      title: 'Build Substrate Bridge',
      description: 'Comprehensive cross-chain bridge implementation with multi-sig.',
      budgetMin: BigInt(5000),
      budgetMax: BigInt(10000),
      currency: 'USDC',
      status: 'PUBLISHED',
      createdAt: new Date(),
      publishedAt: new Date(),
    });

    const request = new Request('http://localhost/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'client-1',
        'x-user-role': 'client',
      },
      body: JSON.stringify({
        title: 'Build Substrate Bridge',
        description: 'Comprehensive cross-chain bridge implementation with multi-sig.',
        budgetMin: 5000,
        budgetMax: 10000,
        currency: 'USDC',
        skills: ['Solidity'],
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBe('job-123');
    expect(json.data.budgetMin).toBe(5000);
    expect(json.data.budgetMax).toBe(10000);
  });
});
