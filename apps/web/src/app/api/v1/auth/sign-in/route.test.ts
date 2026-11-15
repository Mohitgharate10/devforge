import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@devforge/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

import { resetRateLimits } from '@/server/shared/rate-limit';
import { POST } from './route';

describe('POST /api/v1/auth/sign-in rate limiting', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  afterEach(() => {
    resetRateLimits();
  });

  it('rate limits after exceeding max sign-in attempts (429 RATE_LIMITED)', async () => {
    const ip = '198.51.100.99';

    // The sign-in rate limiter allows 10 attempts per 15 minutes
    for (let i = 0; i < 10; i++) {
      const req = new Request('http://localhost/api/v1/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
      });
      const res = await POST(req);
      // Under limit: fails with validation or auth error (not 429)
      expect(res.status).not.toBe(429);
    }

    // 11th request from same IP must be rejected with 429
    const blockedReq = new Request('http://localhost/api/v1/auth/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
    });

    const blockedRes = await POST(blockedReq);
    expect(blockedRes.status).toBe(429);

    const body = await blockedRes.json();
    expect(body.error.code).toBe('RATE_LIMITED');
    expect(blockedRes.headers.get('Retry-After')).toBeDefined();
    expect(blockedRes.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(blockedRes.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});
