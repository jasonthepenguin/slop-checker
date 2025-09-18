import 'server-only';

import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';

import { getClientIdentifier } from './requestIdentity';
import {
  SESSION_COOKIE_NAME,
  SESSION_HEADER_NAME,
  SESSION_MAX_AGE_MS,
} from './sessionConstants';

const TOKEN_SEPARATOR = '.';

const getSessionSecret = () => {
  const secret = process.env.ANALYZE_SESSION_SECRET;
  if (!secret) {
    throw new Error('ANALYZE_SESSION_SECRET is not configured');
  }
  return secret;
};

const signValue = (value: string) =>
  crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');

export const issueSessionToken = (request: NextRequest) => {
  const clientId = getClientIdentifier(request);
  const sessionId = crypto.randomUUID();
  const issuedAt = Date.now();

  const base = [sessionId, issuedAt].join(TOKEN_SEPARATOR);
  const signature = signValue([base, clientId].join(TOKEN_SEPARATOR));

  return {
    token: base,
    cookieValue: [base, signature].join(TOKEN_SEPARATOR),
    expires: new Date(issuedAt + SESSION_MAX_AGE_MS),
  };
};

const parseParts = (value: string | undefined | null) => {
  if (!value) return null;
  const parts = value.split(TOKEN_SEPARATOR);
  if (parts.length !== 3) return null;
  const [sessionId, issuedAtRaw, signature] = parts;
  const issuedAt = Number.parseInt(issuedAtRaw, 10);
  if (!sessionId || Number.isNaN(issuedAt) || !signature) return null;
  return { sessionId, issuedAt, signature };
};

export const verifySessionToken = (request: NextRequest) => {
  const headerValue = request.headers.get(SESSION_HEADER_NAME);
  if (!headerValue) {
    return { valid: false, error: 'Missing session token' } as const;
  }

  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const parsedCookie = parseParts(cookieValue);
  if (!parsedCookie) {
    return { valid: false, error: 'Missing or invalid session cookie' } as const;
  }

  const headerParts = headerValue.split(TOKEN_SEPARATOR);
  if (headerParts.length !== 2) {
    return { valid: false, error: 'Malformed session token' } as const;
  }

  const [sessionId, issuedAtRaw] = headerParts;
  const issuedAt = Number.parseInt(issuedAtRaw, 10);
  if (!sessionId || Number.isNaN(issuedAt)) {
    return { valid: false, error: 'Malformed session token' } as const;
  }

  if (
    parsedCookie.sessionId !== sessionId ||
    parsedCookie.issuedAt !== issuedAt
  ) {
    return { valid: false, error: 'Session token mismatch' } as const;
  }

  if (Date.now() - issuedAt > SESSION_MAX_AGE_MS) {
    return { valid: false, error: 'Session token expired' } as const;
  }

  const clientId = getClientIdentifier(request);
  const expectedSignature = signValue(
    [parsedCookie.sessionId, parsedCookie.issuedAt, clientId].join(
      TOKEN_SEPARATOR,
    ),
  );

  const providedSignature = parsedCookie.signature;

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const providedBuffer = Buffer.from(providedSignature, 'utf8');

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return { valid: false, error: 'Session token verification failed' } as const;
  }

  return { valid: true } as const;
};

export const SESSION_HEADER = SESSION_HEADER_NAME;
export const SESSION_COOKIE = SESSION_COOKIE_NAME;
