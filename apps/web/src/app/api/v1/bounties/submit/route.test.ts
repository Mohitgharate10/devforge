import { describe, expect, it, vi, beforeEach } from 'vitest';

type MockProposal = {
  id: string;
  jobId: string;
  freelancerProfileId: string;
  coverLetter: string;
  bidAmount: bigint;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  freelancerProfile: {
    id: string;
    userId: string;
    handle: string;
    user: { displayName: string; avatarUrl: string | null };
  };
  job: {
    id: string;
    title: string;
  };
};

const mockDb = vi.hoisted(() => {
  const proposals = new Map<string, MockProposal>();
  let shouldFailTransaction = false;

  const mockUserFindUnique = vi.fn(async () => null);
  const mockUserCreate = vi.fn(
    async ({
      data,
    }: {
      data: { id: string; email: string; displayName: string; status: string };
    }) => ({
      ...data,
      id: data.id || 'mock-user-id',
    }),
  );
  const mockProfileFindUnique = vi.fn(async () => null);
  const mockProfileCreate = vi.fn(
    async ({ data }: { data: { userId: string; handle: string; title: string; bio: string } }) => ({
      ...data,
      id: 'mock-profile-id',
    }),
  );
  const mockProposalCount = vi.fn(async () => proposals.size);
  const mockProposalFindMany = vi.fn(async () => Array.from(proposals.values()));
  const mockProposalFindFirst = vi.fn(async () => Array.from(proposals.values())[0] ?? null);
  const mockProposalUpsert = vi.fn(
    async ({
      create,
    }: {
      create: {
        jobId: string;
        freelancerProfileId: string;
        coverLetter: string;
        bidAmount: bigint;
        currency: string;
        status: string;
      };
    }) => {
      const record: MockProposal = {
        id: '00000000-0000-4000-a000-000000000999',
        jobId: create.jobId,
        freelancerProfileId: create.freelancerProfileId,
        coverLetter: create.coverLetter,
        bidAmount: create.bidAmount,
        currency: create.currency,
        status: create.status,
        createdAt: new Date(),
        updatedAt: new Date(),
        freelancerProfile: {
          id: create.freelancerProfileId,
          userId: '00000000-0000-4000-a000-000000000077',
          handle: 'spec_00000000',
          user: { displayName: 'Verified Specialist', avatarUrl: null },
        },
        job: {
          id: create.jobId,
          title: 'Substrate FRAME Pallet for Cross-Chain Governance',
        },
      };
      proposals.set(record.id, record);
      return record;
    },
  );

  const mockTransaction = vi.fn(
    async <T>(
      cb: (tx: {
        user: { findUnique: typeof mockUserFindUnique; create: typeof mockUserCreate };
        freelancerProfile: {
          findUnique: typeof mockProfileFindUnique;
          create: typeof mockProfileCreate;
        };
        proposal: { upsert: typeof mockProposalUpsert };
      }) => Promise<T>,
    ): Promise<T> => {
      if (shouldFailTransaction) {
        throw new Error('Database connection failed');
      }
      const tx = {
        user: {
          findUnique: mockUserFindUnique,
          create: mockUserCreate,
        },
        freelancerProfile: {
          findUnique: mockProfileFindUnique,
          create: mockProfileCreate,
        },
        proposal: {
          upsert: mockProposalUpsert,
        },
      };
      return await cb(tx);
    },
  );

  return {
    proposals,
    setShouldFailTransaction: (val: boolean) => {
      shouldFailTransaction = val;
    },
    userFindUnique: mockUserFindUnique,
    userCreate: mockUserCreate,
    profileFindUnique: mockProfileFindUnique,
    profileCreate: mockProfileCreate,
    proposalCount: mockProposalCount,
    proposalFindMany: mockProposalFindMany,
    proposalFindFirst: mockProposalFindFirst,
    proposalUpsert: mockProposalUpsert,
    transaction: mockTransaction,
  };
});

vi.mock('@devforge/database', () => ({
  prisma: {
    user: {
      findUnique: mockDb.userFindUnique,
      create: mockDb.userCreate,
    },
    freelancerProfile: {
      findUnique: mockDb.profileFindUnique,
      create: mockDb.profileCreate,
    },
    proposal: {
      count: mockDb.proposalCount,
      findFirst: mockDb.proposalFindFirst,
      findMany: mockDb.proposalFindMany,
      upsert: mockDb.proposalUpsert,
    },
    $transaction: mockDb.transaction,
  },
}));

vi.mock('@/lib/ensure-db-job', () => ({
  ensureDbJobForCanonicalBounty: vi.fn(
    async (bounty: { title: string; client: { organizationName: string; slug: string } }) => ({
      id: '11111111-1111-4111-a111-111111111111',
      title: bounty.title,
      clientProfile: {
        organizationName: bounty.client.organizationName,
        slug: bounty.client.slug,
      },
    }),
  ),
}));

import { prisma } from '@devforge/database';
import { POST, GET, clearSubmissionsStore } from './route';
import { GET as getProposals } from '../../proposals/route';

describe('/api/v1/bounties/submit API', () => {
  beforeEach(() => {
    mockDb.proposals.clear();
    mockDb.setShouldFailTransaction(false);
    clearSubmissionsStore();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const req = new Request('http://localhost/api/v1/bounties/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bountyId: 'job-substrate-pallet',
        prUrl: 'https://github.com/paritytech/polkadot-sdk/pull/1234',
        summary: 'Implemented custom multi-asset conviction pallet.',
        payoutAddress: '0x71C84164b3c915122e265646cD8266395A344e45',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects submissions with invalid EVM payout addresses', async () => {
    const req = new Request('http://localhost/api/v1/bounties/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '00000000-0000-4000-a000-000000000001',
      },
      body: JSON.stringify({
        bountyId: 'job-substrate-pallet',
        prUrl: 'https://github.com/paritytech/polkadot-sdk/pull/1234',
        summary: 'Implemented custom multi-asset conviction pallet.',
        payoutAddress: 'not-a-valid-ethereum-address',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toMatch(/valid 42-character EVM address/i);
  });

  it('rejects non-existent bounty IDs', async () => {
    const req = new Request('http://localhost/api/v1/bounties/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '00000000-0000-4000-a000-000000000001',
      },
      body: JSON.stringify({
        bountyId: 'non-existent-bounty-id',
        prUrl: 'https://github.com/paritytech/polkadot-sdk/pull/1234',
        summary: 'Implemented custom multi-asset conviction pallet.',
        payoutAddress: '0x71C84164b3c915122e265646cD8266395A344e45',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('accepts and persists a valid authenticated bounty submission across in-memory reset', async () => {
    const validPayout = '0x71C84164b3c915122e265646cD8266395A344e45';
    const testUserId = '00000000-0000-4000-a000-000000000077';

    const req = new Request('http://localhost/api/v1/bounties/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
      },
      body: JSON.stringify({
        bountyId: 'job-substrate-pallet',
        prUrl: 'https://github.com/paritytech/polkadot-sdk/pull/1234',
        summary: 'Implemented custom multi-asset conviction pallet with try-runtime benchmarks.',
        payoutAddress: validPayout,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.submission).toBeDefined();
    expect(body.data.submission.bountyId).toBe('job-substrate-pallet');
    expect(body.data.submission.status).toBe('SUBMITTED');
    expect(body.data.submission.payoutAddress).toBe(validPayout);

    // Verify durable database record exists
    const dbProposal = await prisma.proposal.findFirst({
      where: {
        freelancerProfile: { userId: testUserId },
      },
      include: {
        job: true,
        freelancerProfile: true,
      },
    });

    expect(dbProposal).toBeDefined();
    expect(dbProposal?.status).toBe('SUBMITTED');
    expect(dbProposal?.coverLetter).toContain(
      'https://github.com/paritytech/polkadot-sdk/pull/1234',
    );
    expect(dbProposal?.coverLetter).toContain(validPayout);

    // Simulate process restart: completely wipe in-memory fallback store
    clearSubmissionsStore();

    // Verify GET on the bounties submit endpoint reflects DB counts even after store reset
    const bountyCountReq = new Request(
      'http://localhost/api/v1/bounties/submit?bountyId=job-substrate-pallet',
    );
    const bountyCountRes = await GET(bountyCountReq);
    expect(bountyCountRes.status).toBe(200);

    // Verify GET in a brand new request context still reads persisted data
    const getReq = new Request('http://localhost/api/v1/proposals', {
      headers: {
        'x-user-id': testUserId,
      },
    });
    const getRes = await getProposals(getReq);
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(Array.isArray(getBody.data.items)).toBe(true);

    const persistedItem = getBody.data.items.find((i: { id: string }) => i.id === dbProposal?.id);
    expect(persistedItem).toBeDefined();
    expect(persistedItem?.status).toBe('SUBMITTED');
  });

  it('returns 503 EXTERNAL_DEPENDENCY_FAILED when database transaction fails', async () => {
    mockDb.setShouldFailTransaction(true);
    try {
      const req = new Request('http://localhost/api/v1/bounties/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '00000000-0000-4000-a000-000000000077',
        },
        body: JSON.stringify({
          bountyId: 'job-substrate-pallet',
          prUrl: 'https://github.com/paritytech/polkadot-sdk/pull/1234',
          summary: 'Implemented custom multi-asset conviction pallet.',
          payoutAddress: '0x71C84164b3c915122e265646cD8266395A344e45',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error.code).toBe('EXTERNAL_DEPENDENCY_FAILED');
      expect(body.error.message).toMatch(/Database transaction failed/i);
    } finally {
      mockDb.setShouldFailTransaction(false);
    }
  });
});
