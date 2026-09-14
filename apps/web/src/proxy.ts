import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isDev = process.env.NODE_ENV !== 'production';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob:",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  'upgrade-insecure-requests',
].join('; ');

export function proxy(request: NextRequest) {
  const method = request.method.toUpperCase();
  const isApi = request.nextUrl.pathname.startsWith('/api/');

  // CSRF validation on mutating API requests
  if (isApi && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return new NextResponse(
          JSON.stringify({
            error: {
              code: 'FORBIDDEN',
              message: 'Cross-origin mutating requests are forbidden.',
              details: [],
            },
            meta: { requestId: request.headers.get('x-request-id') ?? crypto.randomUUID() },
          }),
          { status: 403, headers: { 'content-type': 'application/json' } },
        );
      }
    }
  }

  const requestHeaders = new Headers(request.headers);
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Request-Id', requestId);
  response.headers.set('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
