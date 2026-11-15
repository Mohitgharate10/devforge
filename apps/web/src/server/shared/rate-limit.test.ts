import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkRateLimit,
  checkMemoryRateLimit,
  checkUpstashRateLimit,
  enforceRateLimit,
  getClientIp,
  getMemoryStoreSize,
  pruneExpiredKeys,
  resetRateLimits,
  type RateLimitOptions,
} from './rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('TRUST_PROXY', 'false');
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    resetRateLimits();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    resetRateLimits();
  });

  describe('getClientIp & Proxy Trust Security', () => {
    it('trusts x-forwarded-for when TRUST_PROXY === true', () => {
      vi.stubEnv('TRUST_PROXY', 'true');
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
      });
      expect(getClientIp(request)).toBe('203.0.113.195');
    });

    it('trusts x-real-ip when TRUST_PROXY === true', () => {
      vi.stubEnv('TRUST_PROXY', 'true');
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '198.51.100.4' },
      });
      expect(getClientIp(request)).toBe('198.51.100.4');
    });

    it('trusts cf-connecting-ip when TRUST_PROXY === true', () => {
      vi.stubEnv('TRUST_PROXY', 'true');
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '192.0.2.1' },
      });
      expect(getClientIp(request)).toBe('192.0.2.1');
    });

    it('trusts x-vercel-forwarded-for when on Vercel', () => {
      vi.stubEnv('VERCEL', '1');
      const request = new Request('http://localhost', {
        headers: { 'x-vercel-forwarded-for': '198.51.100.99, 70.41.3.18' },
      });
      expect(getClientIp(request)).toBe('198.51.100.99');
    });

    it('trusts proxy headers automatically on Vercel even if TRUST_PROXY is unset', () => {
      vi.stubEnv('VERCEL', '1');
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '203.0.113.195' },
      });
      expect(getClientIp(request)).toBe('203.0.113.195');
    });

    it('does NOT key on x-user-id header even if provided (prevents attacker spoofing / evasion)', () => {
      vi.stubEnv('TRUST_PROXY', 'true');
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.195',
          'x-user-id': 'spoofed_attacker_id_123',
        },
      });
      expect(getClientIp(request)).toBe('203.0.113.195');
      expect(getClientIp(request)).not.toContain('spoofed_attacker_id_123');
    });

    it('falls back to 127.0.0.1 when TRUST_PROXY is false/unset and does not use x-user-id', () => {
      vi.stubEnv('TRUST_PROXY', 'false');
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.195',
          'x-user-id': 'spoofed_id',
        },
      });
      expect(getClientIp(request)).toBe('127.0.0.1');
      expect(getClientIp(request)).not.toContain('spoofed_id');
    });
  });

  describe('In-Memory Sliding Window & Pruning', () => {
    const options: RateLimitOptions = {
      windowMs: 60 * 1000, // 1 minute
      max: 3,
      keyPrefix: 'test',
    };

    it('allows requests within the limit and decrements remaining', () => {
      vi.stubEnv('TRUST_PROXY', 'true');
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '10.0.0.1' },
      });

      const res1 = checkMemoryRateLimit(request, options);
      expect(res1.success).toBe(true);
      expect(res1.limit).toBe(3);
      expect(res1.remaining).toBe(2);

      const res2 = checkMemoryRateLimit(request, options);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = checkMemoryRateLimit(request, options);
      expect(res3.success).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it('blocks requests once max is reached', () => {
      vi.stubEnv('TRUST_PROXY', 'true');
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '10.0.0.2' },
      });

      checkMemoryRateLimit(request, options);
      checkMemoryRateLimit(request, options);
      checkMemoryRateLimit(request, options);

      const blockedRes = checkMemoryRateLimit(request, options);
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.reset).toBeGreaterThan(Date.now());
    });

    it('resets window after sliding window duration expires', () => {
      vi.stubEnv('TRUST_PROXY', 'true');
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '10.0.0.3' },
      });

      checkMemoryRateLimit(request, options);
      checkMemoryRateLimit(request, options);
      checkMemoryRateLimit(request, options);

      expect(checkMemoryRateLimit(request, options).success).toBe(false);

      // Advance clock past window
      vi.advanceTimersByTime(61 * 1000);

      const freshRes = checkMemoryRateLimit(request, options);
      expect(freshRes.success).toBe(true);
      expect(freshRes.remaining).toBe(2);
    });

    it('automatically prunes expired keys on request and frees memory', () => {
      vi.stubEnv('TRUST_PROXY', 'true');
      const reqA = new Request('http://localhost', { headers: { 'x-real-ip': '10.0.0.10' } });
      const reqB = new Request('http://localhost', { headers: { 'x-real-ip': '10.0.0.20' } });

      checkMemoryRateLimit(reqA, options);
      checkMemoryRateLimit(reqB, options);
      expect(getMemoryStoreSize()).toBe(2);

      // Advance past the 60s window
      vi.advanceTimersByTime(65 * 1000);

      // Manual prune verification
      pruneExpiredKeys(Date.now());
      expect(getMemoryStoreSize()).toBe(0);

      // Automatic prune on next request
      checkMemoryRateLimit(reqA, options);
      expect(getMemoryStoreSize()).toBe(1);

      vi.advanceTimersByTime(65 * 1000);
      // New request from reqB triggers pruning of expired reqA
      checkMemoryRateLimit(reqB, options);
      expect(getMemoryStoreSize()).toBe(1);
    });

    it('tracks different IP addresses separately when TRUST_PROXY is true', () => {
      vi.stubEnv('TRUST_PROXY', 'true');
      const reqA = new Request('http://localhost', { headers: { 'x-real-ip': '10.0.0.4' } });
      const reqB = new Request('http://localhost', { headers: { 'x-real-ip': '10.0.0.5' } });

      checkMemoryRateLimit(reqA, options);
      checkMemoryRateLimit(reqA, options);
      checkMemoryRateLimit(reqA, options);
      expect(checkMemoryRateLimit(reqA, options).success).toBe(false);

      expect(checkMemoryRateLimit(reqB, options).success).toBe(true);
    });
  });

  describe('Upstash Redis Distributed Limiter', () => {
    const options: RateLimitOptions = {
      windowMs: 60 * 1000,
      max: 5,
      keyPrefix: 'upstash-test',
    };

    it('calls Upstash REST API pipeline when configured and enforces limit', async () => {
      vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://mock-redis.upstash.io');
      vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'mock-token-xyz');

      // Mock fetch for Upstash pipeline
      const fetchMock = vi.fn().mockImplementation(async (_url, init) => {
        const body = JSON.parse(init.body);
        if (body[0][0] === 'INCR') {
          return {
            ok: true,
            status: 200,
            json: async () => [{ result: 1 }, { result: 59000 }],
          };
        }
        return { ok: true, status: 200, json: async () => [{ result: 'OK' }] };
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await checkUpstashRateLimit('test-key-1', options);
      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.limit).toBe(5);
      expect(result?.remaining).toBe(4);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://mock-redis.upstash.io/pipeline',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token-xyz',
          }),
        }),
      );
    });

    it('blocks request when Upstash count exceeds max', async () => {
      vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://mock-redis.upstash.io');
      vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'mock-token-xyz');

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [{ result: 6 }, { result: 45000 }],
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await checkUpstashRateLimit('test-key-blocked', options);
      expect(result).not.toBeNull();
      expect(result?.success).toBe(false);
      expect(result?.remaining).toBe(0);
    });

    it('safely falls back to in-memory store when Upstash request fails', async () => {
      vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://mock-redis.upstash.io');
      vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'mock-token-xyz');

      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', fetchMock);

      const request = new Request('http://localhost', {
        headers: { 'x-user-id': 'fallback-user' },
      });

      // checkRateLimit should catch Upstash error and fallback to in-memory
      const result = await checkRateLimit(request, options);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('enforceRateLimit', () => {
    const options: RateLimitOptions = {
      windowMs: 30 * 1000,
      max: 2,
      keyPrefix: 'enforce-test',
    };

    it('returns null when rate limit is not exceeded', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-user-id': 'user-1' },
      });

      expect(await enforceRateLimit(request, options)).toBeNull();
      expect(await enforceRateLimit(request, options)).toBeNull();
    });

    it('returns 429 NextResponse with standard rate limit headers when exceeded', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-user-id': 'user-blocked', 'x-request-id': 'req-rl-123' },
      });

      await enforceRateLimit(request, options);
      await enforceRateLimit(request, options);

      const response = await enforceRateLimit(request, options);
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
