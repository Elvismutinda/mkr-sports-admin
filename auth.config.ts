import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db/db";
import { systemUser, rolePermission, permission } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = AdminLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Look up in system_users — NOT the public users table
        const [sysUser] = await db
          .select({
            id: systemUser.id,
            name: systemUser.name,
            email: systemUser.email,
            password: systemUser.password,
            avatarUrl: systemUser.avatarUrl,
            status: systemUser.status,
            roleId: systemUser.roleId,
          })
          .from(systemUser)
          .where(eq(systemUser.email, email))
          .limit(1);

        if (!sysUser) return null;

        // Block suspended / inactive accounts at login
        if (sysUser.status !== "active") return null;

        const valid = await bcrypt.compare(password, sysUser.password);
        if (!valid) return null;

        // Resolve permissions from the user's role
        let permissions: string[] = [];
        if (sysUser.roleId) {
          const perms = await db
            .select({ key: permission.key })
            .from(rolePermission)
            .innerJoin(
              permission,
              eq(rolePermission.permissionId, permission.id),
            )
            .where(eq(rolePermission.roleId, sysUser.roleId));

          permissions = perms.map((p) => p.key);
        }

        // Update last login timestamp (fire-and-forget)
        db.update(systemUser)
          .set({ lastLoginAt: new Date() })
          .where(eq(systemUser.id, sysUser.id))
          .catch(() => {});

        return {
          id: sysUser.id,
          name: sysUser.name,
          email: sysUser.email,
          image: sysUser.avatarUrl,
          // Custom fields — picked up in the jwt callback
          permissions,
          roleId: sysUser.roleId,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;