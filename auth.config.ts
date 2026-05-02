import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db/db";
import {
  systemUser,
  rolePermission,
  permission,
  systemLog,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  // Collected client-side and passed as hidden fields
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = AdminLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, ipAddress, userAgent } = parsed.data;

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
        if (sysUser.status !== "active") return null;

        const valid = await bcrypt.compare(password, sysUser.password);
        if (!valid) return null;

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

        // Fire-and-forget: update last login + write login log with real IP/UA
        db.update(systemUser)
          .set({ lastLoginAt: new Date() })
          .where(eq(systemUser.id, sysUser.id))
          .catch(() => {});

        db.insert(systemLog)
          .values({
            actorId: sysUser.id,
            actorType: "system_user",
            action: "LOGIN",
            entityType: "system_user",
            entityId: sysUser.id,
            description: `${sysUser.name} signed in`,
            ipAddress: ipAddress ?? null,
            userAgent: userAgent ?? null,
          })
          .catch(() => {});

        return {
          id: sysUser.id,
          name: sysUser.name,
          email: sysUser.email,
          image: sysUser.avatarUrl,
          permissions,
          roleId: sysUser.roleId,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
