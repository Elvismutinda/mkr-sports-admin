import { db } from "@/lib/db/db";
import { partner } from "@/lib/db/schema";
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

  const { id } = await params;
  const [found] = await db
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
    .where(eq(partner.id, id))
    .limit(1);

  if (!found) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }
  return NextResponse.json(found);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.UPDATE_USER]);
  if (authError) return authError;

  const { id } = await params;
  const body = (await req.json()) as {
    name?: string;
    phone?: string;
    businessName?: string;
    status?: "active" | "inactive" | "suspended";
  };

  const [existing] = await db
    .select({
      name: partner.name,
      phone: partner.phone,
      businessName: partner.businessName,
      status: partner.status,
    })
    .from(partner)
    .where(eq(partner.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  if (body.name) update.name = body.name.trim();
  if (body.phone !== undefined) update.phone = body.phone?.trim() ?? null;
  if (body.businessName !== undefined)
    update.businessName = body.businessName?.trim() ?? null;
  if (body.status) update.status = body.status;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ message: "Nothing to update." });
  }

  await db.update(partner).set(update).where(eq(partner.id, id));

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
    action: body.status === "suspended" ? "SUSPEND_PARTNER" : "UPDATE_PARTNER",
    entityType: "partner",
    entityId: id,
    description: `Updated partner "${existing.name}": ${Object.keys(update).join(", ")}`,
    metadata: { before: changedBefore, after: changedAfter },
    req,
  });

  return NextResponse.json({ message: "Partner updated." });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.DELETE_USER]);
  if (authError) return authError;

  const { id } = await params;
  const [existing] = await db
    .select({
      name: partner.name,
      email: partner.email,
      status: partner.status,
    })
    .from(partner)
    .where(eq(partner.id, id))
    .limit(1);

  await db
    .update(partner)
    .set({ status: "suspended" })
    .where(eq(partner.id, id));

  const actor = await getActor(req);
  logAction({
    actorId: actor?.id,
    actorType: "system_user",
    action: "SUSPEND_PARTNER",
    entityType: "partner",
    entityId: id,
    description: `Suspended partner "${existing?.name}" (${existing?.email})`,
    metadata: {
      before: { status: existing?.status },
      after: { status: "suspended" },
    },
    req,
  });

  return NextResponse.json({ message: "Partner suspended." });
}
