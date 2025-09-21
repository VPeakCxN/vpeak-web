// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth callback
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next();
  }

  // Disable RSC for /auth and /login routes to prevent infinite loops
  if (pathname.startsWith('/auth') || pathname.startsWith('/login')) {
    const response = NextResponse.next();
    response.headers.set('RSC', '0');
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  // Default: continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth routes except callback)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
};
