import { db } from "@/lib/db/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { getActor } from "@/lib/auth/getActor";
import { logAction } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_USER]);
  if (authError) return authError;
  try {
    const { id } = await params;
    const [found] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        position: user.position,
        avatarUrl: user.avatarUrl,
        role: user.role,
        bio: user.bio,
        isActive: user.isActive,
        stats: user.stats,
        attributes: user.attributes,
        aiAnalysis: user.aiAnalysis,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!found)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(found);
  } catch (error) {
    console.error("[GET /api/admin/users/:id]", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.UPDATE_USER]);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      name?: string;
      phone?: string;
      position?: "Goalkeeper" | "Defender" | "Midfielder" | "Forward";
      bio?: string;
      isActive?: boolean;
      stats?: Record<string, unknown>;
      attributes?: Record<string, unknown>;
    };

    const [existing] = await db
      .select({
        name: user.name,
        phone: user.phone,
        position: user.position,
        bio: user.bio,
        isActive: user.isActive,
        stats: user.stats,
        attributes: user.attributes,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!existing)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.phone !== undefined) update.phone = body.phone?.trim() ?? null;
    if (body.position !== undefined) update.position = body.position;
    if (body.bio !== undefined) update.bio = body.bio?.trim() ?? null;
    if (body.isActive !== undefined) update.isActive = body.isActive;
    if (body.stats !== undefined) update.stats = body.stats;
    if (body.attributes !== undefined) update.attributes = body.attributes;

    await db.update(user).set(update).where(eq(user.id, id));

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
      action: "UPDATE_USER",
      entityType: "user",
      entityId: id,
      description: `Updated user "${existing.name}": ${Object.keys(update).join(", ")}`,
      metadata: { before: changedBefore, after: changedAfter },
      req,
    });
    return NextResponse.json({ message: "User updated." });
  } catch (error) {
    console.error("[PATCH /api/admin/users/:id]", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.DELETE_USER]);
  if (authError) return authError;
  try {
    const { id } = await params;
    const [existing] = await db
      .select({ name: user.name, email: user.email, isActive: user.isActive })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    await db.update(user).set({ isActive: false }).where(eq(user.id, id));
    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "DEACTIVATE_USER",
      entityType: "user",
      entityId: id,
      description: `Deactivated user "${existing?.name}" (${existing?.email})`,
      metadata: {
        before: { isActive: existing?.isActive ?? true },
        after: { isActive: false },
      },
      req,
    });
    return NextResponse.json({ message: "User deactivated." });
  } catch (error) {
    console.error("[DELETE /api/admin/users/:id]", error);
    return NextResponse.json(
      { error: "Failed to deactivate user" },
      { status: 500 },
    );
  }
}
