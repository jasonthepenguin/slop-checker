import { NextRequest } from 'next/server';
import { ratelimit } from './redis';

export async function checkRateLimit(request: NextRequest) {
  // If rate limiting is not configured, allow all requests
  if (!ratelimit) {
    console.warn('Rate limiting is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.');
    return {
      success: true,
      limit: 999,
      reset: Date.now() + 30000,
      remaining: 999,
      retryAfter: 0
    };
  }

  const ip = request.headers.get('x-forwarded-for') ??
             request.headers.get('x-real-ip') ??
             'anonymous';

  const identifier = ip;

  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  return {
    success,
    limit,
    reset,
    remaining,
    retryAfter: reset ? Math.floor((reset - Date.now()) / 1000) : 0
  };
}