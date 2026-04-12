import { db } from "@/lib/db/db";
import { systemRole, rolePermission, permission } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { getActor } from "@/lib/auth/getActor";
import { logAction } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const authError = await requirePermission(req, Permission.VIEW_ROLE);
  if (authError) return authError;

  try {
    const roles = await db
      .select({
        id: systemRole.id,
        name: systemRole.name,
        description: systemRole.description,
        isDefault: systemRole.isDefault,
        createdAt: systemRole.createdAt,
        updatedAt: systemRole.updatedAt,
      })
      .from(systemRole)
      .orderBy(systemRole.name);

    // Fetch permissions for each role
    const enriched = await Promise.all(
      roles.map(async (role) => {
        const perms = await db
          .select({ key: permission.key, group: permission.group })
          .from(rolePermission)
          .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
          .where(eq(rolePermission.roleId, role.id));

        return { ...role, permissions: perms };
      }),
    );

    return NextResponse.json(enriched, { status: 200 });
  } catch (error) {
    console.error("[GET /api/admin/roles]", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await requirePermission(req, Permission.CREATE_ROLE);
  if (authError) return authError;

  try {
    const { name, description, permissionKeys } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 },
      );
    }

    // Check for duplicate
    const [existing] = await db
      .select({ id: systemRole.id })
      .from(systemRole)
      .where(eq(systemRole.name, name.trim()))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "A role with this name already exists." },
        { status: 409 },
      );
    }

    // Create role
    const [newRole] = await db
      .insert(systemRole)
      .values({ name: name.trim(), description: description?.trim() || null })
      .returning();

    // Assign permissions
    if (Array.isArray(permissionKeys) && permissionKeys.length > 0) {
      const permRows = await db
        .select({ id: permission.id, key: permission.key })
        .from(permission);

      const permMap = Object.fromEntries(permRows.map((p) => [p.key, p.id]));

      const assignments = permissionKeys
        .filter((k: string) => permMap[k])
        .map((k: string) => ({ roleId: newRole.id, permissionId: permMap[k] }));

      if (assignments.length > 0) {
        await db
          .insert(rolePermission)
          .values(assignments)
          .onConflictDoNothing();
      }
    }

    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "CREATE_ROLE",
      entityType: "system_role",
      entityId: newRole.id,
      description: `Created role "${newRole.name}"${Array.isArray(permissionKeys) ? ` with ${permissionKeys.length} permissions` : ""}`,
      req,
    });

    return NextResponse.json(
      { message: "Role created.", data: newRole },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/admin/roles]", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 },
    );
  }
}
