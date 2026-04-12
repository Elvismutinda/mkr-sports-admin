import { db } from "@/lib/db/db";
import { systemUser, systemRole } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { getToken } from "next-auth/jwt";
import { logAction } from "@/lib/logger";
import { getActor } from "@/lib/auth/getActor";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [
    Permission.VIEW_SYSTEM_USER,
  ]);
  if (authError) return authError;
  try {
    const { id } = await params;
    const [user] = await db
      .select({
        id: systemUser.id,
        name: systemUser.name,
        email: systemUser.email,
        phone: systemUser.phone,
        avatarUrl: systemUser.avatarUrl,
        status: systemUser.status,
        roleId: systemUser.roleId,
        roleName: systemRole.name,
        lastLoginAt: systemUser.lastLoginAt,
        createdAt: systemUser.createdAt,
        updatedAt: systemUser.updatedAt,
      })
      .from(systemUser)
      .leftJoin(systemRole, eq(systemUser.roleId, systemRole.id))
      .where(eq(systemUser.id, id))
      .limit(1);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET /api/admin/system-users/:id]", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [
    Permission.UPDATE_SYSTEM_USER,
  ]);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, phone, roleId, status } = body as {
      name?: string;
      phone?: string;
      roleId?: string | null;
      status?: "active" | "inactive" | "suspended";
    };
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.id === id && status === "suspended")
      return NextResponse.json(
        { error: "You cannot suspend your own account." },
        { status: 400 },
      );
    const [existing] = await db
      .select({
        id: systemUser.id,
        name: systemUser.name,
        phone: systemUser.phone,
        status: systemUser.status,
        roleId: systemUser.roleId,
      })
      .from(systemUser)
      .where(eq(systemUser.id, id))
      .limit(1);

    if (!existing)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    await db
      .update(systemUser)
      .set({
        ...(name ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone?.trim() ?? null } : {}),
        ...(roleId !== undefined ? { roleId: roleId ?? null } : {}),
        ...(status ? { status } : {}),
      })
      .where(eq(systemUser.id, id));

    const actor = await getActor(req);
    const changes = [
      name && "name",
      phone !== undefined && "phone",
      roleId !== undefined && "role",
      status && `status→${status}`,
    ]
      .filter(Boolean)
      .join(", ");
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action:
        status === "suspended" ? "SUSPEND_SYSTEM_USER" : "UPDATE_SYSTEM_USER",
      entityType: "system_user",
      entityId: id,
      description: `Updated admin user "${existing.name}" — ${changes}`,
      metadata: {
        // before — exactly what was in the DB
        before: {
          name: existing.name,
          phone: existing.phone,
          roleId: existing.roleId,
          status: existing.status,
        },
        // after — apply only the fields that were actually sent in the request body
        after: {
          name: name?.trim() ?? existing.name,
          phone: phone !== undefined ? (phone?.trim() ?? null) : existing.phone,
          roleId: roleId !== undefined ? (roleId ?? null) : existing.roleId,
          status: status ?? existing.status,
        },
      },
      req,
    });

    return NextResponse.json({ message: "User updated." });
  } catch (error) {
    console.error("[PATCH /api/admin/system-users/:id]", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [
    Permission.DELETE_SYSTEM_USER,
  ]);
  if (authError) return authError;
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.id === id)
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 },
      );
    const [existing] = await db
      .select({ name: systemUser.name, email: systemUser.email })
      .from(systemUser)
      .where(eq(systemUser.id, id))
      .limit(1);
    await db
      .update(systemUser)
      .set({ status: "suspended" })
      .where(eq(systemUser.id, id));
    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "SUSPEND_SYSTEM_USER",
      entityType: "system_user",
      entityId: id,
      description: `Suspended admin user "${existing?.name}" (${existing?.email})`,
      metadata: {
        before: { status: "active" },
        after: { status: "suspended" },
      },
      req,
    });
    return NextResponse.json({ message: "User suspended." });
  } catch (error) {
    console.error("[DELETE /api/admin/system-users/:id]", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
