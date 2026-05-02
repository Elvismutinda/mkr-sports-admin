import { db } from "@/lib/db/db";
import { kycDocument, kycSubmission, partner } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

/**
 * GET /api/admin/kyc-documents
 *
 * Returns individual KYC documents across all submissions, grouped by
 * submission so the UI can render one card per submission with its docs.
 *
 * Query params:
 *   q          – search partner name / email
 *   status     – filter by document status: "pending" | "accepted" | "rejected"
 *   page, limit
 */
export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.SUPER_ADMIN]);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status"); // "pending" | "accepted" | "rejected"
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const offset = (page - 1) * limit;

    // ── Build conditions ─────────────────────────────────────────────────────

    const conditions = [];

    if (status) {
      conditions.push(
        eq(kycDocument.status, status as "pending" | "accepted" | "rejected"),
      );
    } else {
      // Default: only show documents that need attention (pending)
      conditions.push(eq(kycDocument.status, "pending"));
    }

    // ── Fetch distinct submission IDs that have matching docs ────────────────
    // We paginate at the submission level (one card per submission), then
    // fetch all documents for those submissions in a second query.

    const submissionConditions = [...conditions];

    if (q) {
      // Join to partner for name/email search — done via subquery below
      // We'll filter after fetching for simplicity; submissions are bounded
    }

    // Get all submissions that have documents matching the status filter
    const submissionRows = await db
      .selectDistinct({ submissionId: kycDocument.submissionId })
      .from(kycDocument)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(kycDocument.submissionId));

    const allSubmissionIds = submissionRows.map((r) => r.submissionId);

    if (allSubmissionIds.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      });
    }

    // ── Fetch submission + partner metadata ──────────────────────────────────

    const submissionDetails = await db
      .select({
        submissionId: kycSubmission.id,
        partnerId: kycSubmission.partnerId,
        partnerName: partner.name,
        partnerEmail: partner.email,
        partnerBusinessName: partner.businessName,
        attemptNumber: kycSubmission.attemptNumber,
        submittedAt: kycSubmission.submittedAt,
        submissionStatus: kycSubmission.status,
      })
      .from(kycSubmission)
      .leftJoin(partner, eq(kycSubmission.partnerId, partner.id))
      .where(inArray(kycSubmission.id, allSubmissionIds));

    // Apply partner name/email search filter in memory (submissions are bounded)
    const filteredSubmissions = q
      ? submissionDetails.filter(
          (s) =>
            s.partnerName?.toLowerCase().includes(q.toLowerCase()) ||
            s.partnerEmail?.toLowerCase().includes(q.toLowerCase()) ||
            s.partnerBusinessName?.toLowerCase().includes(q.toLowerCase()),
        )
      : submissionDetails;

    const total = filteredSubmissions.length;
    const paginatedSubmissions = filteredSubmissions.slice(
      offset,
      offset + limit,
    );
    const paginatedIds = paginatedSubmissions.map((s) => s.submissionId);

    if (paginatedIds.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // ── Fetch all documents for paginated submissions ─────────────────────────

    const docConditions = [inArray(kycDocument.submissionId, paginatedIds)];
    if (status) {
      docConditions.push(
        eq(kycDocument.status, status as "pending" | "accepted" | "rejected"),
      );
    }

    const documents = await db
      .select({
        id: kycDocument.id,
        submissionId: kycDocument.submissionId,
        partnerId: kycDocument.partnerId,
        documentTypeId: kycDocument.documentTypeId,
        documentLabel: kycDocument.documentLabel,
        fileUrl: kycDocument.fileUrl,
        mimeType: kycDocument.mimeType,
        sizeBytes: kycDocument.sizeBytes,
        status: kycDocument.status,
        rejectionNote: kycDocument.rejectionNote,
        createdAt: kycDocument.createdAt,
      })
      .from(kycDocument)
      .where(and(...docConditions))
      .orderBy(kycDocument.createdAt);

    // ── Group documents by submission ────────────────────────────────────────

    const docsBySubmission = documents.reduce<Record<string, typeof documents>>(
      (acc, doc) => {
        if (!acc[doc.submissionId]) acc[doc.submissionId] = [];
        acc[doc.submissionId].push(doc);
        return acc;
      },
      {},
    );

    const data = paginatedSubmissions.map((s) => ({
      submissionId: s.submissionId,
      partnerId: s.partnerId,
      partnerName: s.partnerName,
      partnerEmail: s.partnerEmail,
      partnerBusinessName: s.partnerBusinessName,
      attemptNumber: s.attemptNumber,
      submittedAt: s.submittedAt,
      submissionStatus: s.submissionStatus,
      documents: docsBySubmission[s.submissionId] ?? [],
    }));

    return NextResponse.json({
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/admin/kyc-documents]", error);
    return NextResponse.json(
      { error: "Failed to fetch KYC documents" },
      { status: 500 },
    );
  }
}
