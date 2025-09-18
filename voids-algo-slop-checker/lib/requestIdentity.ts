import type { NextRequest } from 'next/server';

const FALLBACK_IDENTIFIER = 'unknown';

const stripIpv6Prefix = (value: string) => value.replace(/^::ffff:/, '');

export function getClientIdentifier(request: NextRequest) {
  const directIp = request.ip;
  if (directIp) {
    return stripIpv6Prefix(directIp);
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return stripIpv6Prefix(realIp);
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) {
      return stripIpv6Prefix(first);
    }
  }

  return FALLBACK_IDENTIFIER;
}
