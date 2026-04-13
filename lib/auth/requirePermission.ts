import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Permission } from "@/_utils/enums/permissions.enum";

interface AdminJwt {
  id?: string;
  sub?: string;
  permissions?: string[];
  roleId?: string | null;
}

/**
 * Resolve the correct next-auth JWT cookie name for the current environment.
 *
 * Problem: On Vercel (HTTPS) next-auth v5 sets the cookie as
 *   "__Secure-authjs.session-token"
 * On localhost (HTTP) it uses:
 *   "authjs.session-token"
 *
 * getToken() must be given the SAME cookie name that was used when the token
 * was SET, otherwise it looks for the wrong cookie, finds nothing, and returns
 * null — causing every API route to return 401 in production even when the
 * browser is correctly authenticated.
 *
 * We detect HTTPS by checking NODE_ENV, the request URL, and the
 * x-forwarded-proto header (set by Vercel's edge proxy).
 */
function resolveTokenOptions(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto");
  const isHttps =
    process.env.NODE_ENV === "production" ||
    proto === "https" ||
    req.url.startsWith("https://");

  const cookieName = isHttps
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  return {
    req,
    secret: process.env.NEXTAUTH_SECRET!,
    cookieName,
    // salt must match cookieName (next-auth default behaviour)
    salt: cookieName,
  };
}

/**
 * Server-side guard for admin API routes.
 * Returns a 401/403 NextResponse if the request is not authorized,
 * or null if the request is allowed to proceed.
 *
 * Usage:
 *   const authError = await requirePermission(req, Permission.VIEW_ROLE);
 *   if (authError) return authError;
 */
export async function requirePermission(
  req: NextRequest,
  required: Permission,
): Promise<NextResponse | null> {
  const token = (await getToken(resolveTokenOptions(req))) as AdminJwt | null;

  if (!token?.sub && !token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions: string[] = token.permissions ?? [];

  if (permissions.includes(Permission.SUPER_ADMIN)) return null;

  if (!permissions.includes(required)) {
    return NextResponse.json(
      { error: `Forbidden — missing permission: ${required}` },
      { status: 403 },
    );
  }

  return null;
}

/**
 * Same as requirePermission but checks for ANY of the provided permissions.
 */
export async function requireAnyPermission(
  req: NextRequest,
  required: Permission[],
): Promise<NextResponse | null> {
  const token = (await getToken(resolveTokenOptions(req))) as AdminJwt | null;

  if (!token?.sub && !token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions: string[] = token.permissions ?? [];

  if (permissions.includes(Permission.SUPER_ADMIN)) return null;

  const hasAny = required.some((p) => permissions.includes(p));
  if (!hasAny) {
    return NextResponse.json(
      { error: "Forbidden — insufficient permissions" },
      { status: 403 },
    );
  }

  return null;
}
