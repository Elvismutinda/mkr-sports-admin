import { db } from "@/lib/db/db";
import { kycDocument, systemLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { getActor } from "@/lib/auth/getActor";
import { Permission } from "@/_utils/enums/permissions.enum";
import { z } from "zod";

const ReviewSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("accepted") }),
  z.object({
    decision: z.literal("rejected"),
    rejectionNote: z.string().min(1, "Rejection note is required").max(500),
  }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAnyPermission(req, [Permission.SUPER_ADMIN]);
  if (authError) return authError;

  const actor = await getActor(req);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;  // 👈 await here

  try {
    const body = await req.json();
    const parsed = ReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const [doc] = await db
      .select()
      .from(kycDocument)
      .where(eq(kycDocument.id, id))  // 👈 use destructured id
      .limit(1);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.status !== "pending") {
      return NextResponse.json(
        { error: `Document has already been ${doc.status}` },
        { status: 409 },
      );
    }

    const { decision } = parsed.data;

    const [updated] = await db
      .update(kycDocument)
      .set({
        status: decision,
        rejectionNote: decision === "rejected" ? parsed.data.rejectionNote : null,
      })
      .where(eq(kycDocument.id, id))
      .returning();

    db.insert(systemLog)
      .values({
        actorId: actor.id,
        actorType: "system_user",
        action: decision === "accepted" ? "KYC_DOCUMENT_ACCEPTED" : "KYC_DOCUMENT_REJECTED",
        entityType: "kyc_document",
        entityId: id,
        description: `Document "${doc.documentLabel}" ${decision} for partner ${doc.partnerId}`,
        metadata: {
          documentTypeId: doc.documentTypeId,
          partnerId: doc.partnerId,
          submissionId: doc.submissionId,
          ...(decision === "rejected" && { rejectionNote: parsed.data.rejectionNote }),
        },
      })
      .catch(() => {});

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/admin/kyc-documents/[id]/review]", error);
    return NextResponse.json({ error: "Failed to review document" }, { status: 500 });
  }
}
