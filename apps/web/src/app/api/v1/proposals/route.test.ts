import { beforeEach, describe, it, expect, vi } from 'vitest';

const database = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  profileFindUnique: vi.fn(),
  proposalUpsert: vi.fn(),
  proposalFindMany: vi.fn(),
}));

vi.mock('@devforge/database', () => ({
  prisma: {
    user: { findUnique: database.userFindUnique, create: vi.fn() },
    freelancerProfile: {
      findUnique: database.profileFindUnique,
      create: vi.fn(),
    },
    proposal: {
      upsert: database.proposalUpsert,
      findMany: database.proposalFindMany,
    },
  },
}));

vi.mock('@/lib/ensure-db-job', () => ({
  ensureDbJobForCanonicalBounty: vi.fn(
    async (bounty: {
      id: string;
      title: string;
      client: { organizationName: string; slug: string };
    }) => ({
      id: '00000000-0000-4000-a000-000000000100',
      clientProfileId: '00000000-0000-4000-a000-000000000101',
      clientProfile: {
        userId: '00000000-0000-4000-a000-000000000102',
        organizationName: bounty.client.organizationName,
        slug: bounty.client.slug,
      },
      title: bounty.title,
    }),
  ),
}));

import { POST as submitProposal } from '../jobs/[jobId]/proposals/route';
import { GET as getProposals } from './route';

describe('Proposal Submission and Retrieval Flow', () => {
  beforeEach(() => {
    database.userFindUnique.mockResolvedValue({ id: '00000000-0000-4000-a000-000000000099' });
    database.profileFindUnique.mockResolvedValue({
      id: '00000000-0000-4000-a000-000000000103',
      handle: 'test-specialist',
      user: { displayName: 'Test Specialist', avatarUrl: null },
    });
    database.proposalUpsert.mockImplementation(async ({ create }) => ({
      id: '00000000-0000-4000-a000-000000000104',
      freelancerProfileId: '00000000-0000-4000-a000-000000000103',
      createdAt: new Date(),
      updatedAt: new Date(),
      freelancerProfile: {
        handle: 'test-specialist',
        user: { displayName: 'Test Specialist', avatarUrl: null },
      },
      ...create,
    }));
    database.proposalFindMany.mockResolvedValue([]);
  });

  it('submits a proposal for a canonical bounty and verifies it appears in GET /api/v1/proposals', async () => {
    const testUserId = '00000000-0000-4000-a000-000000000099';
    const postReq = new Request('http://localhost:3000/api/v1/jobs/job-bridge-audit/proposals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
      },
      body: JSON.stringify({
        bidAmount: 15000,
        currency: 'USDC',
        coverLetter:
          'I am a specialized formal verification researcher ready to audit this bridge.',
      }),
    });

    const postRes = await submitProposal(postReq, {
      params: Promise.resolve({ jobId: 'job-bridge-audit' }),
    });

    expect(postRes.status).toBe(201);
    const postJson = await postRes.json();
    expect(postJson.data).toBeDefined();
    expect(postJson.data.jobId).toBe('job-bridge-audit');
    expect(postJson.data.status).toBe('SUBMITTED');
    expect(postJson.data.bidAmount).toBe(15000);

    const submittedId = postJson.data.id;

    // Now query GET /api/v1/proposals with the user's session
    const getReq = new Request('http://localhost:3000/api/v1/proposals', {
      headers: {
        'x-user-id': testUserId,
      },
    });

    const getRes = await getProposals(getReq);
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();

    expect(getJson.data).toBeDefined();
    expect(Array.isArray(getJson.data.items)).toBe(true);

    // Verify the proposal is present in the dashboard items list
    const foundProposal = getJson.data.items.find(
      (item: { id: string; jobId: string }) =>
        item.id === submittedId || item.jobId === 'job-bridge-audit',
    );
    expect(foundProposal).toBeDefined();
    expect(foundProposal.bidAmount).toBe(15000);
    expect(foundProposal.status).toBe('SUBMITTED');
  });

  it('rejects proposal submission with invalid cover letter length', async () => {
    const postReq = new Request(
      'http://localhost:3000/api/v1/jobs/job-substrate-pallet/proposals',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidAmount: 12000,
          currency: 'USDC',
          coverLetter: 'Too short',
        }),
      },
    );

    const postRes = await submitProposal(postReq, {
      params: Promise.resolve({ jobId: 'job-substrate-pallet' }),
    });

    expect(postRes.status).toBe(400);
    const postJson = await postRes.json();
    expect(postJson.error).toBeDefined();
    expect(postJson.error.code).toBe('VALIDATION_FAILED');
  });
});
