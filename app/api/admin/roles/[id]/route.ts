import { db } from "@/lib/db/db";
import {
  systemRole,
  rolePermission,
  permission,
  systemUser,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { logAction } from "@/lib/logger";
import { getActor } from "@/lib/auth/getActor";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authError = await requirePermission(req, Permission.VIEW_ROLE);
  if (authError) return authError;
  try {
    const { id } = await params;
    const [role] = await db
      .select()
      .from(systemRole)
      .where(eq(systemRole.id, id))
      .limit(1);
    if (!role)
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    const perms = await db
      .select({
        id: permission.id,
        key: permission.key,
        group: permission.group,
      })
      .from(rolePermission)
      .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
      .where(eq(rolePermission.roleId, id));
    return NextResponse.json({ ...role, permissions: perms });
  } catch (error) {
    console.error("[GET /api/admin/roles/:id]", error);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authError = await requirePermission(req, Permission.UPDATE_ROLE);
  if (authError) return authError;
  try {
    const { id } = await params;
    const { name, description, permissionKeys } = await req.json();

    const [existing] = await db
      .select({
        id: systemRole.id,
        name: systemRole.name,
        description: systemRole.description,
      })
      .from(systemRole)
      .where(eq(systemRole.id, id))
      .limit(1);
    if (!existing)
      return NextResponse.json({ error: "Role not found" }, { status: 404 });

    // Existing permission keys for diff
    const existingPerms = await db
      .select({ key: permission.key })
      .from(rolePermission)
      .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
      .where(eq(rolePermission.roleId, id));
    const existingPermKeys = existingPerms.map((p) => p.key);

    await db
      .update(systemRole)
      .set({
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined
          ? { description: description?.trim() || null }
          : {}),
      })
      .where(eq(systemRole.id, id));

    if (Array.isArray(permissionKeys)) {
      const allPerms = await db
        .select({ id: permission.id, key: permission.key })
        .from(permission);
      const permMap = Object.fromEntries(allPerms.map((p) => [p.key, p.id]));
      const desiredIds = permissionKeys
        .filter((k: string) => permMap[k])
        .map((k: string) => permMap[k]);
      await db.delete(rolePermission).where(eq(rolePermission.roleId, id));
      if (desiredIds.length > 0)
        await db
          .insert(rolePermission)
          .values(
            desiredIds.map((permId: string) => ({
              roleId: id,
              permissionId: permId,
            })),
          )
          .onConflictDoNothing();
    }

    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "UPDATE_ROLE",
      entityType: "system_role",
      entityId: id,
      description: `Updated role "${existing.name}"`,
      metadata: {
        before: {
          name: existing.name,
          description: existing.description,
          permissions: existingPermKeys,
        },
        after: {
          name: name?.trim() ?? existing.name,
          description:
            description !== undefined
              ? description?.trim() || null
              : existing.description,
          permissions: Array.isArray(permissionKeys)
            ? permissionKeys
            : existingPermKeys,
        },
      },
      req,
    });
    return NextResponse.json({ message: "Role updated." });
  } catch (error) {
    console.error("[PATCH /api/admin/roles/:id]", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authError = await requirePermission(req, Permission.DELETE_ROLE);
  if (authError) return authError;
  try {
    const { id } = await params;
    const [inUse] = await db
      .select({ id: systemUser.id })
      .from(systemUser)
      .where(eq(systemUser.roleId, id))
      .limit(1);
    if (inUse)
      return NextResponse.json(
        { error: "Cannot delete a role that is assigned to active users." },
        { status: 409 },
      );
    const [role] = await db
      .select({ name: systemRole.name })
      .from(systemRole)
      .where(eq(systemRole.id, id))
      .limit(1);
    await db.delete(systemRole).where(eq(systemRole.id, id));
    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "DELETE_ROLE",
      entityType: "system_role",
      entityId: id,
      description: `Deleted role "${role?.name}"`,
      metadata: { before: { name: role?.name }, after: null },
      req,
    });
    return NextResponse.json({ message: "Role deleted." });
  } catch (error) {
    console.error("[DELETE /api/admin/roles/:id]", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 },
    );
  }
}
