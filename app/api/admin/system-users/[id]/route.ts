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
    const [found] = await db
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
    if (!found)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(found);
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

    const update: Record<string, unknown> = {};
    if (name) update.name = name.trim();
    if (phone !== undefined) update.phone = phone?.trim() ?? null;
    if (roleId !== undefined) update.roleId = roleId ?? null;
    if (status) update.status = status;

    await db.update(systemUser).set(update).where(eq(systemUser.id, id));

    const changedBefore: Record<string, unknown> = {};
    const changedAfter: Record<string, unknown> = {};
    for (const key of Object.keys(update)) {
      changedBefore[key] = (existing as Record<string, unknown>)[key];
      changedAfter[key] = update[key];
    }

    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action:
        status === "suspended" ? "SUSPEND_SYSTEM_USER" : "UPDATE_SYSTEM_USER",
      entityType: "system_user",
      entityId: id,
      description: `Updated admin user "${existing.name}": ${Object.keys(update).join(", ")}`,
      metadata: { before: changedBefore, after: changedAfter },
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
      .select({
        name: systemUser.name,
        email: systemUser.email,
        status: systemUser.status,
      })
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
        before: { status: existing?.status },
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
