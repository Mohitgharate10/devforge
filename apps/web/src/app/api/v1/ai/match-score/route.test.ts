import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/v1/ai/match-score', () => {
  it('returns 401 when unauthenticated (no session)', async () => {
    const request = new Request('http://localhost/api/v1/ai/match-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requiredSkills: ['Solidity', 'Foundry', 'TypeScript'],
        candidateSkills: ['Solidity', 'Foundry'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 400 when the request body fails validation', async () => {
    const request = new Request('http://localhost/api/v1/ai/match-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '00000000-0000-4000-a000-000000000001',
      },
      body: JSON.stringify({
        // candidateSkills missing
        requiredSkills: ['Solidity'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns 200 with skill match calculations when authenticated with valid payload', async () => {
    const request = new Request('http://localhost/api/v1/ai/match-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '00000000-0000-4000-a000-000000000001',
      },
      body: JSON.stringify({
        requiredSkills: ['Rust', 'Substrate', 'EVM'],
        candidateSkills: ['Rust', 'Substrate', 'TypeScript'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(typeof body.data.score).toBe('number');
    expect(body.data.score).toBeGreaterThanOrEqual(0);
    expect(body.data.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(body.data.matchedSkills)).toBe(true);
    expect(Array.isArray(body.data.missingSkills)).toBe(true);
    expect(body.data.matchedSkills).toContain('Rust');
    expect(body.data.missingSkills).toContain('EVM');
  });
});
