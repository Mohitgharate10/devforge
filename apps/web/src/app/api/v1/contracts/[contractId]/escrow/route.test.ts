import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/v1/contracts/:contractId/escrow', () => {
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
