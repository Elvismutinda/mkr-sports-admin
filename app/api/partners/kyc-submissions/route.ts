import { db } from "@/lib/db/db";
import {
  KycStatus,
  kycStatuses,
  kycSubmission,
  partner,
} from "@/lib/db/schema";
import { eq, desc, count, and, ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.SUPER_ADMIN]);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const offset = (page - 1) * limit;

    const conditions = [];
    
    if (status && kycStatuses.includes(status as KycStatus)) {
      conditions.push(eq(kycSubmission.status, status as KycStatus));
    }

    if (q) {
      conditions.push(
        or(
          ilike(partner.name, `%${q}%`),
          ilike(partner.email, `%${q}%`),
          ilike(partner.businessName, `%${q}%`),
        )!,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [submissions, [{ total }]] = await Promise.all([
      db
        .select({
          id: kycSubmission.id,
          partnerId: kycSubmission.partnerId,
          partnerName: partner.name,
          partnerEmail: partner.email,
          partnerBusinessName: partner.businessName,
          attemptNumber: kycSubmission.attemptNumber,
          status: kycSubmission.status,
          reviewedAt: kycSubmission.reviewedAt,
          rejectionReason: kycSubmission.rejectionReason,
          submittedAt: kycSubmission.submittedAt,
        })
        .from(kycSubmission)
        .leftJoin(partner, eq(kycSubmission.partnerId, partner.id))
        .where(whereClause)
        .orderBy(desc(kycSubmission.submittedAt))
        .limit(limit)
        .offset(offset),

      db
        .select({ total: count() })
        .from(kycSubmission)
        .leftJoin(partner, eq(kycSubmission.partnerId, partner.id))
        .where(whereClause),
    ]);

    return NextResponse.json({
      data: submissions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/admin/kyc-submissions]", error);
    return NextResponse.json(
      { error: "Failed to fetch KYC submissions" },
      { status: 500 },
    );
  }
}
