import { describe, it, expect } from 'vitest';
import { POST as submitProposal } from '../jobs/[jobId]/proposals/route';
import { GET as getProposals } from './route';

describe('Proposal Submission and Retrieval Flow', () => {
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
        coverLetter: 'I am a specialized formal verification researcher ready to audit this bridge.',
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
      (item: { id: string; jobId: string }) => item.id === submittedId || item.jobId === 'job-bridge-audit',
    );
    expect(foundProposal).toBeDefined();
    expect(foundProposal.bidAmount).toBe(15000);
    expect(foundProposal.status).toBe('SUBMITTED');
  });

  it('rejects proposal submission with invalid cover letter length', async () => {
    const postReq = new Request('http://localhost:3000/api/v1/jobs/job-substrate-pallet/proposals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bidAmount: 12000,
        currency: 'USDC',
        coverLetter: 'Too short',
      }),
    });

    const postRes = await submitProposal(postReq, {
      params: Promise.resolve({ jobId: 'job-substrate-pallet' }),
    });

    expect(postRes.status).toBe(400);
    const postJson = await postRes.json();
    expect(postJson.error).toBeDefined();
    expect(postJson.error.code).toBe('VALIDATION_FAILED');
  });
});
