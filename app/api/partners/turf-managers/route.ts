import { db } from "@/lib/db/db";
import { partner, passwordResetToken } from "@/lib/db/schema";
import { eq, ilike, or, count, desc, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { getActor } from "@/lib/auth/getActor";
import { logAction } from "@/lib/logger";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_USER]);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  // role filter — defaults to turf_manager but can be extended
  const role = (searchParams.get("role") ?? "turf_manager") as "turf_manager";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
  const offset = (page - 1) * limit;

  const roleCondition = eq(partner.role, role);
  const searchCondition =
    q.length > 0
      ? or(
          ilike(partner.name, `%${q}%`),
          ilike(partner.email, `%${q}%`),
          ilike(partner.businessName, `%${q}%`),
        )
      : undefined;

  const whereClause = searchCondition
    ? and(roleCondition, searchCondition)
    : roleCondition;

  const [partners, [{ total }]] = await Promise.all([
    db
      .select({
        id: partner.id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        businessName: partner.businessName,
        avatarUrl: partner.avatarUrl,
        role: partner.role,
        status: partner.status,
        emailVerified: partner.emailVerified,
        lastLoginAt: partner.lastLoginAt,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
      })
      .from(partner)
      .where(whereClause)
      .orderBy(desc(partner.createdAt))
      .limit(limit)
      .offset(offset),

    db.select({ total: count() }).from(partner).where(whereClause),
  ]);

  return NextResponse.json({
    data: partners,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.CREATE_USER]);
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      name: string;
      email: string;
      phone?: string;
      businessName?: string;
      role?: "turf_manager";
    };

    const { name, email, phone, businessName, role = "turf_manager" } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: partner.id })
      .from(partner)
      .where(eq(partner.email, email.trim().toLowerCase()))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "A partner with this email already exists." },
        { status: 409 },
      );
    }

    const tempPassword = await bcrypt.hash(
      Math.random().toString(36).slice(-12) + "Aa1!",
      12,
    );

    const [created] = await db
      .insert(partner)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: tempPassword,
        phone: phone?.trim() ?? null,
        businessName: businessName?.trim() ?? null,
        role,
        status: "active",
      })
      .returning({
        id: partner.id,
        name: partner.name,
        email: partner.email,
        role: partner.role,
      });

    // Invite token — 48 h, points to the Partner Portal password setup
    const token = randomBytes(32).toString("hex");
    await db.insert(passwordResetToken).values({
      email: created.email,
      token,
      expires: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    const { sendPartnerInviteEmail } = await import("@/lib/mail");
    await sendPartnerInviteEmail(
      created.email,
      created.name,
      token,
      role,
    ).catch((err) => console.error("[mail] partner invite failed:", err));

    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "CREATE_PARTNER",
      entityType: "partner",
      entityId: created.id,
      description: `Created partner "${created.name}" (${created.email}) — role: ${role}`,
      metadata: {
        before: null,
        after: { name: created.name, email: created.email, role },
      },
      req,
    });

    return NextResponse.json(
      { message: "Partner created. Invite email sent.", data: created },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/admin/partners]", error);
    return NextResponse.json(
      { error: "Failed to create partner" },
      { status: 500 },
    );
  }
}
