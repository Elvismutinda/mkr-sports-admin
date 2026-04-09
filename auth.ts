import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { db } from "@/lib/db/db";
import { systemUser, rolePermission, permission } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,

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
      if (user) {
        token.id = user.id;
        token.permissions = user.permissions ?? [];
        token.roleId = user.roleId ?? null;
        return token;
      }

      // Refresh permissions on every token rotation
      if (token.id && token.roleId) {
        try {
          const perms = await db
            .select({ key: permission.key })
            .from(rolePermission)
            .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
            .where(eq(rolePermission.roleId, token.roleId as string));
          token.permissions = perms.map((p) => p.key);
        } catch {
          // Keep stale permissions if DB is unavailable
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.permissions = token.permissions as string[] ?? [];
        session.user.roleId = token.roleId ?? null;
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
    maxAge: 8 * 60 * 60, // 8-hour admin sessions
  },
});