import { db } from "@/lib/db/db";
import { systemUser, systemRole } from "@/lib/db/schema";
import { eq, ilike, or, count, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import bcrypt from "bcryptjs";
import { getActor } from "@/lib/auth/getActor";
import { logAction } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [
    Permission.VIEW_SYSTEM_USER,
  ]);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const offset = (page - 1) * limit;

    const whereClause =
      q.length > 0
        ? or(
            ilike(systemUser.name, `%${q}%`),
            ilike(systemUser.email, `%${q}%`),
          )
        : undefined;

    const [users, [{ total }]] = await Promise.all([
      db
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
        .where(whereClause)
        .orderBy(desc(systemUser.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ total: count() }).from(systemUser).where(whereClause),
    ]);

    return NextResponse.json(
      {
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/admin/system-users]", error);
    return NextResponse.json(
      { error: "Failed to fetch system users" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAnyPermission(req, [
    Permission.CREATE_SYSTEM_USER,
  ]);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { name, email, phone, roleId } = body as {
      name: string;
      email: string;
      phone?: string;
      roleId?: string;
    };

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: systemUser.id })
      .from(systemUser)
      .where(eq(systemUser.email, email.trim()))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 },
      );
    }

    // Generate a temporary password — user should reset on first login
    const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const [created] = await db
      .insert(systemUser)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        phone: phone?.trim() ?? null,
        roleId: roleId ?? null,
        status: "active",
      })
      .returning({
        id: systemUser.id,
        name: systemUser.name,
        email: systemUser.email,
        status: systemUser.status,
        roleId: systemUser.roleId,
        createdAt: systemUser.createdAt,
      });

    // Generate a password reset token for first-time setup
    const { randomBytes } = await import("crypto");
    const setupToken = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { passwordResetToken } = await import("@/lib/db/schema");
    await db.insert(passwordResetToken).values({
      email: created.email,
      token: setupToken,
      expires,
    });

    // Send welcome email with password setup link
    const { sendAdminWelcomeEmail } = await import("@/lib/mail");
    await sendAdminWelcomeEmail(created.email, created.name, setupToken).catch(
      (err) => console.error("[mail] welcome email failed:", err),
    );

    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "CREATE_SYSTEM_USER",
      entityType: "system_user",
      entityId: created.id,
      description: `Created admin user "${created.name}" (${created.email})`,
      metadata: {
        roleId: created.roleId ?? null,
        status: created.status,
      },
      req,
    });

    return NextResponse.json(
      { message: "System user created.", data: created, tempPassword },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/admin/system-users]", error);
    return NextResponse.json(
      { error: "Failed to create system user" },
      { status: 500 },
    );
  }
}
