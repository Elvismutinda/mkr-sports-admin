import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export interface Actor {
  id: string;
  type: "system_user";
}

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
    salt: cookieName,
  };
}

/**
 * Extracts the authenticated system user from the JWT token.
 * Returns null if the request is unauthenticated.
 * Uses the same cookie resolution logic as requirePermission.ts.
 */
export async function getActor(req: NextRequest): Promise<Actor | null> {
  const token = await getToken(resolveTokenOptions(req));
  const id = (token?.id ?? token?.sub) as string | undefined;
  if (!id) return null;
  return { id, type: "system_user" };
}
