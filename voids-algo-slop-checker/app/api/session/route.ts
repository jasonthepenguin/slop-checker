import { NextRequest, NextResponse } from 'next/server';

import { issueSessionToken, SESSION_COOKIE, SESSION_HEADER } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const { token, cookieValue, expires } = issueSessionToken(request);

    const response = NextResponse.json({ token });
    response.cookies.set({
      name: SESSION_COOKIE,
      value: cookieValue,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires,
      path: '/',
    });
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Session-Header', SESSION_HEADER);

    return response;
  } catch (error) {
    console.error('Failed to issue session token', error);
    return NextResponse.json({ error: 'Session unavailable' }, { status: 500 });
  }
}
