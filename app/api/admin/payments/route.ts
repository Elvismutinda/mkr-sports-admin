import { db } from "@/lib/db/db";
import { payment, user, match, tournament } from "@/lib/db/schema";
import { eq, ilike, or, count, desc, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_PAYMENT]);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (q) conditions.push(or(ilike(user.name, `%${q}%`), ilike(user.email, `%${q}%`), ilike(payment.mpesaReceiptNumber, `%${q}%`)));
    if (status) conditions.push(sql`${payment.status} = ${status}`);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [payments, [{ total }]] = await Promise.all([
      db
        .select({
          id: payment.id,
          userId: payment.userId,
          userName: user.name,
          userEmail: user.email,
          matchId: payment.matchId,
          matchLocation: match.location,
          tournamentId: payment.tournamentId,
          tournamentName: tournament.name,
          amount: payment.amount,
          currency: payment.currency,
          phone: payment.phone,
          mpesaReceiptNumber: payment.mpesaReceiptNumber,
          checkoutRequestId: payment.checkoutRequestId,
          status: payment.status,
          failureReason: payment.failureReason,
          emailSent: payment.emailSent,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        })
        .from(payment)
        .innerJoin(user, eq(payment.userId, user.id))
        .leftJoin(match, eq(payment.matchId, match.id))
        .leftJoin(tournament, eq(payment.tournamentId, tournament.id))
        .where(whereClause)
        .orderBy(desc(payment.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ total: count() })
        .from(payment)
        .innerJoin(user, eq(payment.userId, user.id))
        .where(whereClause),
    ]);

    return NextResponse.json({
      data: payments,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/admin/payments]", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}