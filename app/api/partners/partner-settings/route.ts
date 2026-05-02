import { db } from "@/lib/db/db";
import { partnerSettings } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { z } from "zod";

const SettingsSchema = z.object({
  sessionTimeoutMinutes: z.number().int().min(15).max(480),
  maxFailedLogins: z.number().int().min(3).max(20),
  autoSuspendAfterDays: z.number().int().min(30).max(365),
  passwordMinLength: z.number().int().min(6).max(32),
  requirePasswordSpecialChar: z.boolean(),
  requirePasswordNumber: z.boolean(),
  notifyOnBookingConfirmed: z.boolean(),
  notifyOnPaymentReceived: z.boolean(),
  notifyOnTurfReview: z.boolean(),
  notifyOnAccountSuspended: z.boolean(),
  notifyOnKycApproved: z.boolean(),
  notifyOnKycRejected: z.boolean(),
  supportEmail: z.string().email(),
  defaultCurrency: z.enum(["KES", "USD", "EUR"]),
  defaultCommissionPercent: z.number().min(0).max(50),
});

/**
 * GET /api/admin/partner-settings
 * Returns the current partner portal settings (single row).
 * Seeds the row with defaults if it doesn't exist yet.
 */
export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.SUPER_ADMIN]);
  if (authError) return authError;

  try {
    let [row] = await db.select().from(partnerSettings).limit(1);

    // Seed defaults on first access
    if (!row) {
      [row] = await db.insert(partnerSettings).values({}).returning();
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("[GET /api/admin/partner-settings]", error);
    return NextResponse.json(
      { error: "Failed to fetch partner settings" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/partner-settings
 * Upserts the partner portal settings row.
 */
export async function PUT(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.SUPER_ADMIN]);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = SettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Check if row exists
    const [existing] = await db
      .select({ id: partnerSettings.id })
      .from(partnerSettings)
      .limit(1);

    let row;
    if (existing) {
      [row] = await db
        .update(partnerSettings)
        .set({
          ...data,
          defaultCommissionPercent: String(data.defaultCommissionPercent),
        })
        .returning();
    } else {
      [row] = await db
        .insert(partnerSettings)
        .values({
          ...data,
          defaultCommissionPercent: String(data.defaultCommissionPercent),
        })
        .returning();
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("[PUT /api/admin/partner-settings]", error);
    return NextResponse.json(
      { error: "Failed to save partner settings" },
      { status: 500 },
    );
  }
}
