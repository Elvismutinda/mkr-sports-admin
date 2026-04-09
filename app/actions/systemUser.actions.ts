"use server";

import { db } from "@/lib/db/db";
import { systemUser, systemRole } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { Permission } from "@/_utils/enums/permissions.enum";

function hasPermission(permissions: string[], required: Permission): boolean {
  return (
    permissions.includes(Permission.SUPER_ADMIN) ||
    permissions.includes(required)
  );
}

async function getSessionPermissions(): Promise<string[]> {
  const session = await auth();
  return session?.user?.permissions ?? [];
}

/**
 * Assigns a system role to a system user.
 * Only callable by users with UPDATE_SYSTEM_USER permission.
 */
export async function assignRoleAction(
  targetUserId: string,
  roleId: string | null,
): Promise<{ success: boolean; error?: string }> {
  const permissions = await getSessionPermissions();

  if (!hasPermission(permissions, Permission.UPDATE_SYSTEM_USER)) {
    return { success: false, error: "Forbidden" };
  }

  if (roleId !== null) {
    const [role] = await db
      .select({ id: systemRole.id })
      .from(systemRole)
      .where(eq(systemRole.id, roleId))
      .limit(1);

    if (!role) return { success: false, error: "Role not found" };
  }

  await db
    .update(systemUser)
    .set({ roleId })
    .where(eq(systemUser.id, targetUserId));

  return { success: true };
}

/**
 * Creates a new system user (admin panel operator).
 * Requires CREATE_SYSTEM_USER permission.
 */
export async function createSystemUserAction(data: {
  name: string;
  email: string;
  password: string; // should be pre-hashed by the caller
  phone?: string;
  roleId?: string;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const permissions = await getSessionPermissions();

  if (!hasPermission(permissions, Permission.CREATE_SYSTEM_USER)) {
    return { success: false, error: "Forbidden" };
  }

  const [existing] = await db
    .select({ id: systemUser.id })
    .from(systemUser)
    .where(eq(systemUser.email, data.email))
    .limit(1);

  if (existing) {
    return { success: false, error: "A user with this email already exists." };
  }

  const [created] = await db
    .insert(systemUser)
    .values({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone ?? null,
      roleId: data.roleId ?? null,
    })
    .returning({ id: systemUser.id });

  return { success: true, id: created.id };
}

/**
 * Deactivates (suspends) a system user.
 * Requires DELETE_SYSTEM_USER permission.
 */
export async function suspendSystemUserAction(
  targetUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const permissions = await getSessionPermissions();

  if (!hasPermission(permissions, Permission.DELETE_SYSTEM_USER)) {
    return { success: false, error: "Forbidden" };
  }

  await db
    .update(systemUser)
    .set({ status: "suspended" })
    .where(eq(systemUser.id, targetUserId));

  return { success: true };
}