import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PATH = "/auth";

/**
 * Admin portal middleware.
 *
 * Route table:
 *   /auth          → always public (login page)
 *   /api/auth/**   → always public (next-auth handlers)
 *   /api/**        → protected (admin API routes)
 *   /**            → protected (admin UI)
 *
 * next-auth's `auth()` middleware wrapper reads the JWT cookie and
 * attaches the session to the request. If there's no valid session
 * and the route is not public, we redirect to /auth.
 */
export default auth((req) => {
  const { nextUrl, auth: session } = req as any;
  const pathname: string = nextUrl.pathname;
  const isAuthenticated = !!session?.user?.id;

  const isPublic =
    pathname === AUTH_PATH ||
    pathname.startsWith(AUTH_PATH + "/") ||
    pathname.startsWith("/api/auth/");

  if (isPublic) return NextResponse.next();

  if (!isAuthenticated) {
    // API routes get a 401 JSON response; UI routes get a redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL(AUTH_PATH, nextUrl.origin);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (Next.js static files)
     * - _next/image  (Next.js image optimization)
     * - favicon.ico
     * - public assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)).*)",
  ],
};