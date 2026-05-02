import { db } from "@/lib/db/db";
import { kycSettings } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { z } from "zod";

const KycDocumentSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(128),
  description: z.string().max(256),
  required: z.boolean(),
  acceptedTypes: z.enum(["image", "pdf", "any"]),
  maxSizeMb: z.number().int().min(1).max(50),
});

const KycSettingsSchema = z.object({
  approvalMode: z.enum(["manual", "auto"]),
  reviewSlaHours: z.number().int().min(1).max(168),
  expiryDays: z.number().int().min(30).max(730),
  allowResubmission: z.boolean(),
  maxResubmissions: z.number().int().min(1).max(10),
  notifyAdminOnSubmission: z.boolean(),
  adminNotificationEmail: z.string().email(),
  approvalEmailTemplate: z.string().min(1).max(2000),
  rejectionEmailTemplate: z.string().min(1).max(2000),
  requiredDocuments: z.array(KycDocumentSchema).min(1, {
    message: "At least one document is required",
  }),
});

const DEFAULT_DOCUMENTS = [
  {
    id: "national_id",
    label: "National ID / Passport",
    description: "Government-issued photo identification",
    required: true,
    acceptedTypes: "image" as const,
    maxSizeMb: 5,
  },
  {
    id: "business_reg",
    label: "Business Registration Certificate",
    description: "Certificate of incorporation or business name registration",
    required: true,
    acceptedTypes: "pdf" as const,
    maxSizeMb: 10,
  },
  {
    id: "kra_pin",
    label: "KRA PIN Certificate",
    description: "Kenya Revenue Authority PIN certificate",
    required: true,
    acceptedTypes: "pdf" as const,
    maxSizeMb: 5,
  },
  {
    id: "turf_photos",
    label: "Turf Facility Photos",
    description: "Clear photos of the turf and surrounding area",
    required: false,
    acceptedTypes: "image" as const,
    maxSizeMb: 20,
  },
];

/**
 * GET /api/admin/kyc-settings
 * Returns KYC flow settings. Seeds defaults on first access.
 */
export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.SUPER_ADMIN]);
  if (authError) return authError;

  try {
    let [row] = await db.select().from(kycSettings).limit(1);

    if (!row) {
      [row] = await db
        .insert(kycSettings)
        .values({ requiredDocuments: DEFAULT_DOCUMENTS })
        .returning();
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("[GET /api/admin/kyc-settings]", error);
    return NextResponse.json(
      { error: "Failed to fetch KYC settings" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/kyc-settings
 * Upserts KYC flow settings.
 */
export async function PUT(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.SUPER_ADMIN]);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = KycSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: kycSettings.id })
      .from(kycSettings)
      .limit(1);

    let row;
    if (existing) {
      [row] = await db.update(kycSettings).set(parsed.data).returning();
    } else {
      [row] = await db.insert(kycSettings).values(parsed.data).returning();
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("[PUT /api/admin/kyc-settings]", error);
    return NextResponse.json(
      { error: "Failed to save KYC settings" },
      { status: 500 },
    );
  }
}
