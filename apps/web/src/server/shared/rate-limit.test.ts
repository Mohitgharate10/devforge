import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkRateLimit,
  enforceRateLimit,
  getClientIp,
  resetRateLimits,
  type RateLimitOptions,
} from './rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimits();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimits();
  });

  describe('getClientIp', () => {
    it('extracts IP from x-forwarded-for (first entry)', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
      });
      expect(getClientIp(request)).toBe('203.0.113.195');
    });

    it('extracts IP from x-real-ip when x-forwarded-for is absent', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '198.51.100.4' },
      });
      expect(getClientIp(request)).toBe('198.51.100.4');
    });

    it('extracts IP from cf-connecting-ip when other headers are absent', () => {
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '192.0.2.1' },
      });
      expect(getClientIp(request)).toBe('192.0.2.1');
    });

    it('falls back to 127.0.0.1 when no IP headers are present', () => {
      const request = new Request('http://localhost');
      expect(getClientIp(request)).toBe('127.0.0.1');
    });
  });

  describe('checkRateLimit', () => {
    const options: RateLimitOptions = {
      windowMs: 60 * 1000, // 1 minute
      max: 3,
      keyPrefix: 'test',
    };

    it('allows requests within the limit and decrements remaining', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '10.0.0.1' },
      });

      const res1 = checkRateLimit(request, options);
      expect(res1.success).toBe(true);
      expect(res1.limit).toBe(3);
      expect(res1.remaining).toBe(2);

      const res2 = checkRateLimit(request, options);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = checkRateLimit(request, options);
      expect(res3.success).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it('blocks requests once max is reached', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '10.0.0.2' },
      });

      checkRateLimit(request, options);
      checkRateLimit(request, options);
      checkRateLimit(request, options);

      const blockedRes = checkRateLimit(request, options);
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.reset).toBeGreaterThan(Date.now());
    });

    it('resets window after sliding window duration expires', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '10.0.0.3' },
      });

      checkRateLimit(request, options);
      checkRateLimit(request, options);
      checkRateLimit(request, options);

      expect(checkRateLimit(request, options).success).toBe(false);

      // Advance clock past window
      vi.advanceTimersByTime(61 * 1000);

      const freshRes = checkRateLimit(request, options);
      expect(freshRes.success).toBe(true);
      expect(freshRes.remaining).toBe(2);
    });

    it('tracks different IP addresses separately', () => {
      const reqA = new Request('http://localhost', { headers: { 'x-real-ip': '10.0.0.4' } });
      const reqB = new Request('http://localhost', { headers: { 'x-real-ip': '10.0.0.5' } });

      checkRateLimit(reqA, options);
      checkRateLimit(reqA, options);
      checkRateLimit(reqA, options);
      expect(checkRateLimit(reqA, options).success).toBe(false);

      expect(checkRateLimit(reqB, options).success).toBe(true);
    });
  });

  describe('enforceRateLimit', () => {
    const options: RateLimitOptions = {
      windowMs: 30 * 1000,
      max: 2,
      keyPrefix: 'enforce-test',
    };

    it('returns null when rate limit is not exceeded', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.1' },
      });

      expect(enforceRateLimit(request, options)).toBeNull();
      expect(enforceRateLimit(request, options)).toBeNull();
    });

    it('returns 429 NextResponse with standard rate limit headers when exceeded', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.2', 'x-request-id': 'req-rl-123' },
      });

      enforceRateLimit(request, options);
      enforceRateLimit(request, options);

      const response = enforceRateLimit(request, options);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(429);

      const headers = response?.headers;
      expect(headers?.get('Retry-After')).toBeDefined();
      expect(headers?.get('X-RateLimit-Limit')).toBe('2');
      expect(headers?.get('X-RateLimit-Remaining')).toBe('0');
      expect(headers?.get('X-RateLimit-Reset')).toBeDefined();
      expect(headers?.get('RateLimit-Limit')).toBe('2');
      expect(headers?.get('RateLimit-Remaining')).toBe('0');
      expect(headers?.get('RateLimit-Reset')).toBeDefined();

      const body = await response?.json();
      expect(body.error.code).toBe('RATE_LIMITED');
      expect(body.meta.requestId).toBe('req-rl-123');
    });
  });
});
