import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export interface Actor {
  id: string;
  type: "system_user";
}

/**
 * Extracts the authenticated system user from the JWT token.
 * Returns null if the request is unauthenticated (should not happen inside
 * a permission-guarded route, but handled gracefully).
 */
export async function getActor(req: NextRequest): Promise<Actor | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return null;
  return { id: token.id as string, type: "system_user" };
}
