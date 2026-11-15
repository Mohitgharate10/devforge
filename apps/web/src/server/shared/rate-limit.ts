import { NextResponse } from 'next/server';
import { failure } from '@/server/shared/http/api-response';

/**
 * Reusable Rate Limiting Module
 *
 * Serverless / Multi-Instance Deployment Notice:
 * ----------------------------------------------
 * When running on serverless environments (e.g. Next.js on Vercel, AWS Lambda) or
 * containerized deployments behind load balancers with multiple instances,
 * in-memory rate limiting operates strictly within the memory scope of each isolate/process.
 * State is not automatically shared across multiple instances or separate lambda cold starts.
 *
 * For distributed production environments requiring strict global rate enforcement,
 * configure Upstash Redis via UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * or standard Redis via REDIS_URL. When configured, distributed rate limiting can be
 * hooked into this interface. When not configured, this module seamlessly falls back to
 * an in-memory sliding window limiter tracking requests by client IP / key.
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
  reset: number; // UNIX epoch timestamp in milliseconds when window resets
}

interface WindowRecord {
  timestamps: number[];
}

// In-memory sliding window cache
const memoryStore = new Map<string, WindowRecord>();

export const isRedisConfigured = Boolean(
  (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
  (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379'),
);

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp?.trim()) return realIp.trim();
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp?.trim()) return cfIp.trim();
  return '127.0.0.1';
}

export function resetRateLimits(): void {
  memoryStore.clear();
}

export function checkRateLimit(request: Request, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowMs;
  const max = options.max;
  const key = options.keyGenerator
    ? options.keyGenerator(request)
    : `${options.keyPrefix ?? 'rl'}:${getClientIp(request)}`;

  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

  // Filter out timestamps outside the sliding window
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

export function enforceRateLimit(request: Request, options: RateLimitOptions): NextResponse | null {
  const result = checkRateLimit(request, options);
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
