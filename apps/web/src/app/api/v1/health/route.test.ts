import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('GET /api/v1/health', () => {
  it('returns the standard success envelope', async () => {
    const response = GET(new Request('http://localhost/api/v1/health'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toMatchObject({ status: 'ok', service: 'web' });
    expect(payload.meta.requestId).toEqual(expect.any(String));
  });
});
