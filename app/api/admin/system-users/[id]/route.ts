import { db } from "@/lib/db/db";
import { systemUser, systemRole } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { getToken } from "next-auth/jwt";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_SYSTEM_USER]);
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("[GET /api/admin/system-users/:id]", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.UPDATE_SYSTEM_USER]);
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

    // Prevent self-suspension
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.id === id && status === "suspended") {
      return NextResponse.json({ error: "You cannot suspend your own account." }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: systemUser.id })
      .from(systemUser)
      .where(eq(systemUser.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db
      .update(systemUser)
      .set({
        ...(name ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone?.trim() ?? null } : {}),
        ...(roleId !== undefined ? { roleId: roleId ?? null } : {}),
        ...(status ? { status } : {}),
      })
      .where(eq(systemUser.id, id));

    return NextResponse.json({ message: "User updated." }, { status: 200 });
  } catch (error) {
    console.error("[PATCH /api/admin/system-users/:id]", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.DELETE_SYSTEM_USER]);
  if (authError) return authError;

  try {
    const { id } = await params;

    // Soft-delete: suspend instead of hard delete to preserve audit trail
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.id === id) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    await db
      .update(systemUser)
      .set({ status: "suspended" })
      .where(eq(systemUser.id, id));

    return NextResponse.json({ message: "User suspended." }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /api/admin/system-users/:id]", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}