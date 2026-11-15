import { NextResponse } from 'next/server';
import { failure } from '@/server/shared/http/api-response';

/**
 * Reusable Rate Limiting Module
 *
 * Distributed vs. In-Memory Strategy & Serverless Notice:
 * --------------------------------------------------------
 * 1. Distributed Limiter:
 *    When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, requests
 *    are metered globally via Upstash Redis REST API pipelines (INCR + PTTL/PEXPIRE).
 *    This ensures consistent rate limits across serverless instances (Vercel / Lambda)
 *    and multi-container load-balanced deployments.
 *
 * 2. In-Memory Fallback:
 *    When Upstash credentials are not configured (e.g. local development, testing,
 *    or fallback upon Redis network outage), the limiter uses a local sliding-window
 *    counter with automatic expired-key pruning.
 *
 *    Serverless Caveat: In-memory counters are local to the running Node.js process /
 *    lambda container and reset on cold starts. For production multi-instance topologies,
 *    provision an Upstash Redis store to enforce global guarantees.
 */

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  keyGenerator?: (request: Request) => string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // UNIX epoch millisecond timestamp
}

interface WindowRecord {
  timestamps: number[];
  windowMs: number;
}

// In-memory sliding window cache
const memoryStore = new Map<string, WindowRecord>();

export function isUpstashConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(
    url && token && !url.includes('your-upstash-instance') && !url.includes('placeholder'),
  );
}

export function getMemoryStoreSize(): number {
  return memoryStore.size;
}

export function resetRateLimits(): void {
  memoryStore.clear();
}

/**
 * Prunes expired keys from the in-memory map.
 * Removes keys where all timestamps are older than their windowMs.
 */
export function pruneExpiredKeys(now = Date.now()): void {
  for (const [key, record] of memoryStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => ts > now - record.windowMs);
    if (record.timestamps.length === 0) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Resolves the client identifier for rate limiting.
 *
 * Proxy Trust Security:
 * When TRUST_PROXY === 'true' or running on Vercel (process.env.VERCEL === '1' or VERCEL_ENV),
 * we trust forwarded IP headers:
 * - 'x-vercel-forwarded-for' (Vercel-injected client IP)
 * - 'x-forwarded-for' (first hop)
 * - 'x-real-ip'
 * - 'cf-connecting-ip' (Cloudflare)
 *
 * Security Note:
 * Never keys on client-supplied headers like 'x-user-id' to prevent callers
 * from bypassing limits by rotating headers, and never aggregates all untrusted callers
 * into a single shared bucket.
 */
export function getClientIp(request: Request): string {
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const trustProxy = process.env.TRUST_PROXY === 'true' || isVercel;

  if (trustProxy) {
    const vercelIp = request.headers.get('x-vercel-forwarded-for');
    if (vercelIp?.trim()) {
      const firstIp = vercelIp.split(',')[0]?.trim();
      if (firstIp) return firstIp;
    }
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      const firstIp = forwardedFor.split(',')[0]?.trim();
      if (firstIp) return firstIp;
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp?.trim()) return realIp.trim();
    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp?.trim()) return cfIp.trim();
  }

  // When proxy is not trusted and not on Vercel, fallback to default local address
  return '127.0.0.1';
}

/**
 * Executes a distributed rate limit check against the Upstash Redis REST API.
 */
export async function checkUpstashRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const baseUrl = url.replace(/\/+$/, '');
    const pipelineRes = await fetch(`${baseUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['PTTL', key],
      ]),
    });

    if (!pipelineRes.ok) {
      console.warn(`Upstash rate limit pipeline returned HTTP ${pipelineRes.status}`);
      return null;
    }

    const data = (await pipelineRes.json()) as Array<{ result: number }>;
    const count = data[0]?.result ?? 1;
    let pttl = data[1]?.result ?? -1;

    // If key had no expiration (-1 or <= 0), establish window TTL
    if (pttl <= 0) {
      pttl = options.windowMs;
      await fetch(`${baseUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([['PEXPIRE', key, options.windowMs]]),
      });
    }

    const reset = Date.now() + Math.max(0, pttl);

    if (count > options.max) {
      return {
        success: false,
        limit: options.max,
        remaining: 0,
        reset,
      };
    }

    return {
      success: true,
      limit: options.max,
      remaining: Math.max(0, options.max - count),
      reset,
    };
  } catch (err) {
    console.warn('Upstash rate limit request failed, falling back to memory store:', err);
    return null;
  }
}

/**
 * Checks in-memory sliding window rate limits, automatically pruning expired keys.
 */
export function checkMemoryRateLimit(request: Request, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  // Automatically prune expired keys on each request
  pruneExpiredKeys(now);

  const windowMs = options.windowMs;
  const max = options.max;
  const key = options.keyGenerator
    ? options.keyGenerator(request)
    : `${options.keyPrefix ?? 'rl'}:${getClientIp(request)}`;

  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [], windowMs };
    memoryStore.set(key, record);
  } else {
    record.windowMs = windowMs;
  }

  // Filter timestamps within current sliding window
  const windowStart = now - windowMs;
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= max) {
    const oldestTimestamp = record.timestamps[0] ?? now;
    const reset = oldestTimestamp + windowMs;
    return {
      success: false,
      limit: max,
      remaining: 0,
      reset,
    };
  }

  record.timestamps.push(now);
  const oldestTimestamp = record.timestamps[0] ?? now;
  const reset = oldestTimestamp + windowMs;
  const remaining = Math.max(0, max - record.timestamps.length);

  return {
    success: true,
    limit: max,
    remaining,
    reset,
  };
}

/**
 * Primary rate limit check: prefers Upstash Redis if configured, otherwise in-memory sliding window.
 */
export async function checkRateLimit(
  request: Request,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  if (isUpstashConfigured()) {
    const key = options.keyGenerator
      ? options.keyGenerator(request)
      : `${options.keyPrefix ?? 'rl'}:${getClientIp(request)}`;

    const upstashResult = await checkUpstashRateLimit(key, options);
    if (upstashResult) {
      return upstashResult;
    }
  }

  return checkMemoryRateLimit(request, options);
}

export function setRateLimitHeaders(headers: Headers, result: RateLimitResult): void {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  headers.set('Retry-After', String(retryAfterSeconds));
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.reset / 1000)));
  headers.set('RateLimit-Limit', String(result.limit));
  headers.set('RateLimit-Remaining', String(Math.max(0, result.remaining)));
  headers.set('RateLimit-Reset', String(retryAfterSeconds));
}

/**
 * Middleware helper returning 429 response with retry headers when limit exceeded, or null when allowed.
 */
export async function enforceRateLimit(
  request: Request,
  options: RateLimitOptions,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, options);
  if (!result.success) {
    const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
    const response = failure(
      {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        status: 429,
      },
      requestId,
    );
    setRateLimitHeaders(response.headers, result);
    return response;
  }
  return null;
}

// Default presets
export const AUTH_SIGN_IN_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyPrefix: 'auth:sign-in',
};

export const AUTH_SIGN_UP_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyPrefix: 'auth:sign-up',
};

export const AUTH_PASSWORD_FORGOT_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyPrefix: 'auth:pwd-forgot',
};

export const AUTH_PASSWORD_RESET_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyPrefix: 'auth:pwd-reset',
};

export const AI_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyPrefix: 'ai',
};

export const JOB_CREATE_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyPrefix: 'job:create',
};

export const MESSAGE_POST_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  keyPrefix: 'msg:create',
};

export const BOUNTY_SUBMIT_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyPrefix: 'bounty:submit',
};

export const REPORT_POST_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyPrefix: 'report:create',
};

export const WALLET_NONCE_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  keyPrefix: 'wallet:nonce',
};
