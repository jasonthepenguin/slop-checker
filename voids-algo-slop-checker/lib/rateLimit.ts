import { NextRequest } from 'next/server';
import { ratelimit } from './redis';
import { getClientIdentifier } from './requestIdentity';

export async function checkRateLimit(request: NextRequest) {
  if (!ratelimit) {
    return {
      success: false,
      limit: 0,
      reset: Date.now(),
      remaining: 0,
      retryAfter: 30,
    };
  }

  const identifier = getClientIdentifier(request);

  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

    return {
      success,
      limit,
      reset,
      remaining,
      retryAfter: reset ? Math.max(Math.floor((reset - Date.now()) / 1000), 0) : 0,
    };
  } catch (error) {
    console.error('Rate limit evaluation failed', error);
    return {
      success: false,
      limit: 0,
      reset: Date.now(),
      remaining: 0,
      retryAfter: 60,
    };
  }
}
