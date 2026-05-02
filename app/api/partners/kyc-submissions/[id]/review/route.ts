import { db } from "@/lib/db/db";
import {
  kycSubmission,
  partner,
  kycSettings,
  systemLog,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { getActor } from "@/lib/auth/getActor";
import { Permission } from "@/_utils/enums/permissions.enum";
import { z } from "zod";

type PartnerKycUpdate = {
  kycStatus: "approved" | "rejected";
  kycReviewedAt: Date;
  kycReviewedBy: string;
  kycRejectionReason: string | null;
};

const ReviewSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("approved"),
    adminNotes: z.string().max(1000).optional(),
  }),
  z.object({
    decision: z.literal("rejected"),
    rejectionReason: z
      .string()
      .min(1, "Rejection reason is required")
      .max(1000),
    adminNotes: z.string().max(1000).optional(),
  }),
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAnyPermission(req, [Permission.SUPER_ADMIN]);
  if (authError) return authError;

  const actor = await getActor(req);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = ReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { decision, adminNotes } = parsed.data;

    const [submission] = await db
      .select()
      .from(kycSubmission)
      .where(eq(kycSubmission.id, id))
      .limit(1);

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    if (submission.status !== "pending" && submission.status !== "in_review") {
      return NextResponse.json(
        {
          error: `Cannot review a submission with status: ${submission.status}`,
        },
        { status: 409 },
      );
    }

    const now = new Date();

    const [updated] = await db
      .update(kycSubmission)
      .set({
        status: decision === "approved" ? "approved" : "rejected",
        reviewedBy: actor.id,
        reviewedAt: now,
        rejectionReason:
          decision === "rejected" ? parsed.data.rejectionReason : null,
        adminNotes: adminNotes ?? null,
      })
      .where(eq(kycSubmission.id, id))
      .returning();

    if (decision === "approved") {
      await db
        .update(partner)
        .set({
          kycStatus: "approved",
          kycReviewedAt: now,
          kycReviewedBy: actor.id,
          kycRejectionReason: null,
        } satisfies PartnerKycUpdate)
        .where(eq(partner.id, submission.partnerId));
    } else {
      const [currentPartner] = await db
        .select({
          kycResubmissionCount: partner.kycResubmissionCount,
        })
        .from(partner)
        .where(eq(partner.id, submission.partnerId))
        .limit(1);

      const [settings] = await db
        .select({
          maxResubmissions: kycSettings.maxResubmissions,
          allowResubmission: kycSettings.allowResubmission,
        })
        .from(kycSettings)
        .limit(1);

      const resubmissionCount = (currentPartner?.kycResubmissionCount ?? 0) + 1;
      const maxResubmissions = settings?.maxResubmissions ?? 3;
      const allowResubmission = settings?.allowResubmission ?? true;
      const shouldSuspend =
        !allowResubmission || resubmissionCount >= maxResubmissions;

      await db
        .update(partner)
        .set({
          kycStatus: "rejected",
          kycReviewedAt: now,
          kycReviewedBy: actor.id,
          kycRejectionReason: parsed.data.rejectionReason,
          kycResubmissionCount: resubmissionCount,
          ...(shouldSuspend && { status: "suspended" }),
        } satisfies PartnerKycUpdate & {
          kycResubmissionCount: number;
          status?: "suspended";
        })
        .where(eq(partner.id, submission.partnerId));
    }

    db.insert(systemLog)
      .values({
        actorId: actor.id,
        actorType: "system_user",
        action: decision === "approved" ? "KYC_APPROVED" : "KYC_REJECTED",
        entityType: "kyc_submission",
        entityId: id,
        description: `KYC submission ${decision} for partner ${submission.partnerId}`,
        metadata: {
          decision,
          partnerId: submission.partnerId,
          attemptNumber: submission.attemptNumber,
          ...(decision === "rejected" && {
            rejectionReason: parsed.data.rejectionReason,
          }),
        },
      })
      .catch(() => {});

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /api/admin/kyc-submissions/[id]/review]", error);
    return NextResponse.json(
      { error: "Failed to process KYC review" },
      { status: 500 },
    );
  }
}
