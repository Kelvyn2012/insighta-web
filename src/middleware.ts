import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/api/auth/login", "/api/auth/callback"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let public paths and static assets through
  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Protected pages: redirect to login if no token cookie
  if (!pathname.startsWith("/api/")) {
    const hasToken = request.cookies.has("access_token") || request.cookies.has("refresh_token");
    if (!hasToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
