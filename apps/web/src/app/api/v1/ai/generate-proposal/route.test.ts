import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/v1/ai/generate-proposal', () => {
  it('returns 401 when unauthenticated (no session)', async () => {
    const request = new Request('http://localhost/api/v1/ai/generate-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobTitle: 'Solidity Smart Contract Auditor',
        freelancerName: 'Elena Rostova',
        skills: ['Solidity', 'Foundry'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 400 when the request body fails validation', async () => {
    const request = new Request('http://localhost/api/v1/ai/generate-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '00000000-0000-4000-a000-000000000001',
      },
      body: JSON.stringify({
        jobTitle: 'AB', // too short (< 3 chars)
        freelancerName: '',
        skills: 'not-an-array',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns 200 with generated proposal draft when authenticated with valid payload', async () => {
    const request = new Request('http://localhost/api/v1/ai/generate-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '00000000-0000-4000-a000-000000000001',
      },
      body: JSON.stringify({
        jobTitle: 'Cross-Chain Bridge Security Auditor',
        freelancerName: 'Marcus Vance',
        skills: ['Rust', 'Substrate', 'CosmWasm'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.data.coverLetter).toBeDefined();
    expect(body.data.coverLetter).toContain('Marcus Vance');
    expect(body.data.coverLetter).toContain('Cross-Chain Bridge Security Auditor');
    expect(body.data.suggestedRate).toBeGreaterThan(0);
  });
});
