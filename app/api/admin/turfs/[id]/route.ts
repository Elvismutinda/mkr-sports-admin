import { db } from "@/lib/db/db";
import { turf, user } from "@/lib/db/schema";
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
  const authError = await requireAnyPermission(req, [Permission.VIEW_TURF]);
  if (authError) return authError;
  const { id } = await params;
  const [found] = await db
    .select({
      id: turf.id,
      name: turf.name,
      area: turf.area,
      city: turf.city,
      address: turf.address,
      latitude: turf.latitude,
      longitude: turf.longitude,
      surface: turf.surface,
      amenities: turf.amenities,
      pricePerHour: turf.pricePerHour,
      rating: turf.rating,
      totalReviews: turf.totalReviews,
      capacity: turf.capacity,
      agentId: turf.agentId,
      agentName: user.name,
      isActive: turf.isActive,
      images: turf.images,
      createdAt: turf.createdAt,
      updatedAt: turf.updatedAt,
    })
    .from(turf)
    .leftJoin(user, eq(turf.agentId, user.id))
    .where(eq(turf.id, id))
    .limit(1);
  if (!found)
    return NextResponse.json({ error: "Turf not found" }, { status: 404 });
  return NextResponse.json(found);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.UPDATE_TURF]);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await req.json();

    const [existing] = await db
      .select({
        name: turf.name,
        city: turf.city,
        area: turf.area,
        address: turf.address,
        surface: turf.surface,
        amenities: turf.amenities,
        pricePerHour: turf.pricePerHour,
        capacity: turf.capacity,
        agentId: turf.agentId,
        isActive: turf.isActive,
        latitude: turf.latitude,
        longitude: turf.longitude,
      })
      .from(turf)
      .where(eq(turf.id, id))
      .limit(1);

    if (!existing)
      return NextResponse.json({ error: "Turf not found" }, { status: 404 });

    const allowed = [
      "name",
      "city",
      "area",
      "address",
      "surface",
      "amenities",
      "pricePerHour",
      "capacity",
      "agentId",
      "isActive",
      "latitude",
      "longitude",
    ] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    await db.update(turf).set(update).where(eq(turf.id, id));

    // Build diff only for changed fields
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
      action: "UPDATE_TURF",
      entityType: "turf",
      entityId: id,
      description: `Updated turf "${existing.name}": ${Object.keys(update).join(", ")}`,
      metadata: { before: changedBefore, after: changedAfter },
      req,
    });
    return NextResponse.json({ message: "Turf updated." });
  } catch (error) {
    console.error("[PATCH /api/admin/turfs/:id]", error);
    return NextResponse.json(
      { error: "Failed to update turf" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.DELETE_TURF]);
  if (authError) return authError;
  const { id } = await params;
  const [existing] = await db
    .select({ name: turf.name, isActive: turf.isActive })
    .from(turf)
    .where(eq(turf.id, id))
    .limit(1);
  await db.update(turf).set({ isActive: false }).where(eq(turf.id, id));
  const actor = await getActor(req);
  logAction({
    actorId: actor?.id,
    actorType: "system_user",
    action: "DEACTIVATE_TURF",
    entityType: "turf",
    entityId: id,
    description: `Deactivated turf "${existing?.name}"`,
    metadata: {
      before: { isActive: existing?.isActive ?? true },
      after: { isActive: false },
    },
    req,
  });
  return NextResponse.json({ message: "Turf deactivated." });
}
