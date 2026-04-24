import { db } from "@/lib/db/db";
import { systemUser, systemRole } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { logAction } from "@/lib/logger";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    })
    .from(systemUser)
    .leftJoin(systemRole, eq(systemUser.roleId, systemRole.id))
    .where(eq(systemUser.id, session.user.id))
    .limit(1);
  if (!found)
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json(found);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await req.json()) as {
      name?: string;
      phone?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    // Fetch current state for diff
    const [existing] = await db
      .select({
        name: systemUser.name,
        phone: systemUser.phone,
        password: systemUser.password,
      })
      .from(systemUser)
      .where(eq(systemUser.id, session.user.id))
      .limit(1);

    const update: Record<string, unknown> = {};
    if (body.name?.trim()) update.name = body.name.trim();
    if (body.phone !== undefined) update.phone = body.phone?.trim() || null;

    if (body.newPassword) {
      if (!body.currentPassword)
        return NextResponse.json(
          { error: "Current password is required to set a new password." },
          { status: 400 },
        );
      if (body.newPassword.length < 8)
        return NextResponse.json(
          { error: "New password must be at least 8 characters." },
          { status: 400 },
        );
      const valid = await bcrypt.compare(
        body.currentPassword,
        existing.password,
      );
      if (!valid)
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 },
        );
      update.password = await bcrypt.hash(body.newPassword, 12);
    }

    if (Object.keys(update).length === 0)
      return NextResponse.json({ message: "Nothing to update." });
    await db
      .update(systemUser)
      .set(update)
      .where(eq(systemUser.id, session.user.id));

    const isPasswordChange = "password" in update;

    // Build diff — never expose hashes
    const safeKeys = Object.keys(update).filter((k) => k !== "password");
    const changedBefore: Record<string, unknown> = {};
    const changedAfter: Record<string, unknown> = {};
    for (const key of safeKeys) {
      changedBefore[key] = (existing as Record<string, unknown>)[key];
      changedAfter[key] = update[key];
    }
    if (isPasswordChange) {
      changedBefore.password = "[hidden]";
      changedAfter.password = "[changed]";
    }

    logAction({
      actorId: session.user.id,
      actorType: "system_user",
      action: isPasswordChange ? "CHANGE_PASSWORD" : "UPDATE_PROFILE",
      entityType: "system_user",
      entityId: session.user.id,
      description: isPasswordChange
        ? "Changed own password"
        : `Updated profile: ${safeKeys.join(", ")}`,
      metadata: { before: changedBefore, after: changedAfter },
      req,
    });
    return NextResponse.json({ message: "Profile updated." });
  } catch (error) {
    console.error("[PATCH /api/admin/profile]", error);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 },
    );
  }
}
