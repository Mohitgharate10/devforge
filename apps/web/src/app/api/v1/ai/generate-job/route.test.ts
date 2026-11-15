import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/v1/ai/generate-job', () => {
  it('returns 401 when unauthenticated (no session)', async () => {
    const request = new Request('http://localhost/api/v1/ai/generate-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Senior Rust Engineer',
        category: 'Engineering',
        skills: ['Rust', 'Substrate'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 400 when the request body fails validation', async () => {
    const request = new Request('http://localhost/api/v1/ai/generate-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '00000000-0000-4000-a000-000000000001',
      },
      body: JSON.stringify({
        // title is missing
        category: 'Engineering',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_FAILED');
  });

  it('returns 200 with generated job draft when authenticated with valid payload', async () => {
    const request = new Request('http://localhost/api/v1/ai/generate-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '00000000-0000-4000-a000-000000000001',
      },
      body: JSON.stringify({
        title: 'Zero-Knowledge Circuit Developer',
        category: 'Cryptography',
        skills: ['Circom', 'SnarkJS', 'Solidity'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.data.title).toContain('Zero-Knowledge Circuit Developer');
    expect(body.data.description).toBeDefined();
    expect(Array.isArray(body.data.milestones)).toBe(true);
    expect(body.data.milestones.length).toBeGreaterThan(0);
    expect(body.data.suggestedBudgetMin).toBeGreaterThan(0);
    expect(body.data.suggestedBudgetMax).toBeGreaterThanOrEqual(body.data.suggestedBudgetMin);
  });
});
