import { db } from "@/lib/db/db";
import { user } from "@/lib/db/schema";
import {
  eq,
  ilike,
  or,
  count,
  desc,
  and,
  isNotNull,
  isNull,
} from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import bcrypt from "bcryptjs";
import { getActor } from "@/lib/auth/getActor";
import { logAction } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_USER]);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const role = searchParams.get("role"); // "player" | "agent"
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const offset = (page - 1) * limit;
    const isActiveParam = searchParams.get("isActive");
    const emailVerifiedParam = searchParams.get("emailVerified");

    const conditions = [];
    if (q.length > 0) {
      conditions.push(
        or(ilike(user.name, `%${q}%`), ilike(user.email, `%${q}%`)),
      );
    }
    if (role === "player" || role === "agent") {
      conditions.push(eq(user.role, role));
    }
    if (isActiveParam !== null) {
      conditions.push(eq(user.isActive, isActiveParam === "true"));
    }
    if (emailVerifiedParam !== null) {
      conditions.push(
        emailVerifiedParam === "true"
          ? isNotNull(user.emailVerified)
          : isNull(user.emailVerified),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [users, [{ total }]] = await Promise.all([
      db
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
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .where(whereClause)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ total: count() }).from(user).where(whereClause),
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
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.CREATE_USER]);
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      name: string;
      email: string;
      phone?: string;
      position: "Goalkeeper" | "Defender" | "Midfielder" | "Forward";
      role?: "player" | "agent";
    };

    const { name, email, phone, position, role = "player" } = body;

    if (!name?.trim() || !email?.trim() || !position) {
      return NextResponse.json(
        { error: "Name, email, and position are required." },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email.trim().toLowerCase()))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 },
      );
    }

    // Temporary password — user will reset via verification email
    const tempPassword = await bcrypt.hash(
      Math.random().toString(36).slice(-12) + "Aa1!",
      12,
    );

    const [created] = await db
      .insert(user)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: tempPassword,
        phone: phone?.trim() ?? null,
        position,
        role,
        isActive: true,
      })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        createdAt: user.createdAt,
      });

    // If agent, send welcome/invite email
    if (role === "agent") {
      const { randomBytes } = await import("crypto");
      const { passwordResetToken } = await import("@/lib/db/schema");
      const { sendAgentInviteEmail } = await import("@/lib/mail");

      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

      await db.insert(passwordResetToken).values({
        email: created.email,
        token,
        expires,
      });

      await sendAgentInviteEmail(created.email, created.name, token).catch(
        (err) => console.error("[mail] agent invite failed:", err),
      );
    }

    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "CREATE_USER",
      entityType: "user",
      entityId: created.id,
      description: `Created ${created.role} "${created.name}" (${created.email})`,
      metadata: {
        before: null,
        after: { name: created.name, email: created.email },
      },
      req,
    });

    return NextResponse.json(
      { message: "User created.", data: created },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/admin/users]", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
