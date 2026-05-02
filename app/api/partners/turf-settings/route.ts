import { db } from "@/lib/db/db";
import { turfSettings } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { z } from "zod";

const SurfacePriceSchema = z.record(z.string(), z.number().min(0));

const TurfSettingsSchema = z.object({
  minBookingHours: z.number().min(0.5).max(4),
  maxBookingHours: z.number().min(1).max(24),
  advanceBookingDays: z.number().int().min(1).max(365),
  cancellationHours: z.number().int().min(0).max(72),
  autoApproveListings: z.boolean(),
  requireCapacity: z.boolean(),
  requireSurface: z.boolean(),
  requireImages: z.boolean(),
  minImages: z.number().int().min(1).max(20),
  surfacePriceDefaults: SurfacePriceSchema,
  amenityOptions: z.array(z.string().min(1).max(64)),
});

/**
 * GET /api/admin/turf-settings
 * Returns current turf settings. Seeds defaults on first access.
 */
export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.SUPER_ADMIN]);
  if (authError) return authError;

  try {
    let [row] = await db.select().from(turfSettings).limit(1);

    if (!row) {
      [row] = await db
        .insert(turfSettings)
        .values({
          amenityOptions: [
            "Changing Rooms",
            "Floodlights",
            "Parking",
            "Toilets",
            "Showers",
            "Seating",
            "Cafeteria",
            "First Aid Kit",
            "Ball Provided",
            "Bibs Provided",
            "Water Dispenser",
            "Referee Available",
          ],
          surfacePriceDefaults: {
            natural_grass: 3000,
            artificial_turf: 2500,
            futsal_floor: 2000,
            indoor: 3500,
          },
        })
        .returning();
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("[GET /api/admin/turf-settings]", error);
    return NextResponse.json(
      { error: "Failed to fetch turf settings" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/turf-settings
 * Upserts turf settings.
 */
export async function PUT(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.SUPER_ADMIN]);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = TurfSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const [existing] = await db
      .select({ id: turfSettings.id })
      .from(turfSettings)
      .limit(1);

    let row;
    if (existing) {
      [row] = await db
        .update(turfSettings)
        .set({
          ...data,
          minBookingHours: String(data.minBookingHours),
          maxBookingHours: String(data.maxBookingHours),
        })
        .returning();
    } else {
      [row] = await db
        .insert(turfSettings)
        .values({
          ...data,
          minBookingHours: String(data.minBookingHours),
          maxBookingHours: String(data.maxBookingHours),
        })
        .returning();
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("[PUT /api/admin/turf-settings]", error);
    return NextResponse.json(
      { error: "Failed to save turf settings" },
      { status: 500 },
    );
  }
}
