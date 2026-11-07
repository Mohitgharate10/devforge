import { describe, expect, it } from 'vitest';
import { POST, GET } from './route';

describe('/api/v1/bounties/submit API', () => {
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
        'x-user-id': 'mock-specialist-user-id',
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
        'x-user-id': 'mock-specialist-user-id',
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

  it('accepts and persists a valid authenticated bounty submission', async () => {
    const validPayout = '0x71C84164b3c915122e265646cD8266395A344e45';
    const req = new Request('http://localhost/api/v1/bounties/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'mock-specialist-user-id',
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

    // Verify GET reflects the submission count
    const getReq = new Request('http://localhost/api/v1/bounties/submit?bountyId=job-substrate-pallet');
    const getRes = await GET(getReq);
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.data.countsByBounty['job-substrate-pallet']).toBeGreaterThanOrEqual(1);
  });
});
