import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { db } from "@/lib/db/db";
import { systemUser, rolePermission, permission } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const isProduction = process.env.NODE_ENV === "production";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,

  // ── Critical for Vercel / reverse-proxy deployments ──────────────────────
  // Without trustHost: true, NextAuth rejects requests where the Host header
  // doesn't exactly match NEXTAUTH_URL, which happens behind Vercel's edge.
  trustHost: true,

  // Explicitly configure the session cookie so the name is predictable and
  // matches exactly what getToken() will look for in requirePermission.ts.
  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProduction,
      },
    },
  },

  callbacks: {
    /**
     * Belt-and-suspenders: block sign-in if the account was suspended
     * after the authorize() call ran (e.g. mid-session suspension).
     */
    async signIn({ user }) {
      if (!user.id) return false;
      const [sysUser] = await db
        .select({ status: systemUser.status })
        .from(systemUser)
        .where(eq(systemUser.id, user.id))
        .limit(1);
      return sysUser?.status === "active";
    },

    /**
     * First sign-in: embed id, roleId, and permissions from authorize().
     * Subsequent requests: re-fetch permissions from DB so role changes
     * propagate without forcing a re-login.
     */
    async jwt({ token, user }) {
      // First call after authorize() — user object is present
      if (user) {
        token.id = user.id;
        token.sub = user.id; // keep sub in sync so both fields are reliable
        token.permissions =
          (user as { permissions?: string[] }).permissions ?? [];
        token.roleId = (user as { roleId?: string | null }).roleId ?? null;
        return token;
      }

      // Subsequent calls — refresh permissions from DB so role changes
      // propagate immediately without forcing re-login.
      const actorId = (token.id ?? token.sub) as string | undefined;
      const roleId = token.roleId as string | null | undefined;

      if (actorId && roleId) {
        try {
          const perms = await db
            .select({ key: permission.key })
            .from(rolePermission)
            .innerJoin(
              permission,
              eq(rolePermission.permissionId, permission.id),
            )
            .where(eq(rolePermission.roleId, roleId));
          token.permissions = perms.map((p) => p.key);
        } catch {
          // Keep stale permissions if DB is temporarily unavailable
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.permissions =
          (token.permissions as string[] | undefined) ?? [];
        session.user.roleId =
          (token.roleId as string | null | undefined) ?? null;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth",
    error: "/auth",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes before logout due to inactivity
  },
});
