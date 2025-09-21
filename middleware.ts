// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/login/email", "/auth/error"];
const EXCLUDED_PREFIX = ["/_next", "/api", "/favicon.ico", "/assets", "/images"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (EXCLUDED_PREFIX.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;

  // If accessing protected paths without token => go to login
  if (!PUBLIC_PATHS.includes(pathname) && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If accessing public paths while authed => go to home
  if (PUBLIC_PATHS.includes(pathname) && token) {
    const url = req.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|assets|images).*)"],
};