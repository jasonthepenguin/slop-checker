import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashRedisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (upstashRedisRestUrl && upstashRedisRestToken) {
  redis = new Redis({
    url: upstashRedisRestUrl,
    token: upstashRedisRestToken,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, '30 s'),
    analytics: true,
    prefix: '@upstash/ratelimit',
  });
}

export { redis, ratelimit };