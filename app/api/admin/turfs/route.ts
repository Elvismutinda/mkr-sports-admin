import { db } from "@/lib/db/db";
import { turf, user } from "@/lib/db/schema";
import { eq, ilike, or, count, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { logAction } from "@/lib/logger";
import { getActor } from "@/lib/auth/getActor";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_TURF]);
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
            ilike(turf.name, `%${q}%`),
            ilike(turf.city, `%${q}%`),
            ilike(turf.area, `%${q}%`),
          )
        : undefined;

    const [turfs, [{ total }]] = await Promise.all([
      db
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
        .where(whereClause)
        .orderBy(desc(turf.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(turf).where(whereClause),
    ]);

    return NextResponse.json({
      data: turfs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/admin/turfs]", error);
    return NextResponse.json(
      { error: "Failed to fetch turfs" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.CREATE_TURF]);
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      name: string;
      city: string;
      area?: string;
      address?: string;
      surface?: "natural_grass" | "artificial_turf" | "futsal_floor" | "indoor";
      amenities?: string[];
      pricePerHour?: string;
      capacity?: number;
      agentId?: string;
    };
    if (!body.name?.trim() || !body.city?.trim())
      return NextResponse.json(
        { error: "Name and city are required." },
        { status: 400 },
      );

    const [created] = await db
      .insert(turf)
      .values({
        name: body.name.trim(),
        city: body.city.trim(),
        area: body.area?.trim() ?? null,
        address: body.address?.trim() ?? null,
        surface: body.surface ?? null,
        amenities: body.amenities ?? [],
        pricePerHour: body.pricePerHour ?? null,
        capacity: body.capacity ?? null,
        agentId: body.agentId ?? null,
        isActive: true,
      })
      .returning({ id: turf.id, name: turf.name, createdAt: turf.createdAt });

    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "CREATE_TURF",
      entityType: "turf",
      entityId: created.id,
      description: `Created turf "${created.name}"`,
      metadata: {
        before: null,
        after: { name: created.name },
      },
      req,
    });

    return NextResponse.json(
      { message: "Turf created.", data: created },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/admin/turfs]", error);
    return NextResponse.json(
      { error: "Failed to create turf" },
      { status: 500 },
    );
  }
}
