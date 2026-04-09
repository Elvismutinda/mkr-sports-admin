import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Permission } from "@/_utils/enums/permissions.enum";

interface AdminJwt {
  permissions?: string[];
  sub?: string;
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
  const token = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as AdminJwt | null;

  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions: string[] = token.permissions ?? [];

  // Super admin bypasses all checks
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
  const token = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as AdminJwt | null;

  if (!token?.sub) {
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