import { db } from "@/lib/db/db";
import { payment, user, match, tournament } from "@/lib/db/schema";
import { eq, gte, lte, and, desc, count, sum, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [
    Permission.VIEW_PAYMENT,
    Permission.VIEW_REPORT,
  ]);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const type = searchParams.get("type"); // "match" | "tournament"
  const limit = Math.min(500, parseInt(searchParams.get("limit") ?? "100", 10));

  const conditions = [];
  if (status) conditions.push(sql`${payment.status} = ${status}`);
  if (dateFrom) conditions.push(gte(payment.createdAt, new Date(dateFrom)));
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(payment.createdAt, end));
  }
  if (type === "match") conditions.push(sql`${payment.matchId} IS NOT NULL`);
  if (type === "tournament")
    conditions.push(sql`${payment.tournamentId} IS NOT NULL`);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const payments = await db
    .select({
      id: payment.id,
      userName: user.name,
      userEmail: user.email,
      phone: payment.phone,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      mpesaReceiptNumber: payment.mpesaReceiptNumber,
      matchLocation: match.location,
      tournamentName: tournament.name,
      failureReason: payment.failureReason,
      createdAt: payment.createdAt,
    })
    .from(payment)
    .innerJoin(user, eq(payment.userId, user.id))
    .leftJoin(match, eq(payment.matchId, match.id))
    .leftJoin(tournament, eq(payment.tournamentId, tournament.id))
    .where(whereClause)
    .orderBy(desc(payment.createdAt))
    .limit(limit);

  // Financial summary
  const [summary] = await db
    .select({
      totalTransactions: count(),
      totalRevenue: sum(
        sql<number>`CASE WHEN ${payment.status} = 'success' THEN ${payment.amount}::numeric ELSE 0 END`,
      ),
      totalPending: sum(
        sql<number>`CASE WHEN ${payment.status} = 'pending' THEN ${payment.amount}::numeric ELSE 0 END`,
      ),
      successCount: sum(
        sql<number>`CASE WHEN ${payment.status} = 'success' THEN 1 ELSE 0 END`,
      ),
      failedCount: sum(
        sql<number>`CASE WHEN ${payment.status} = 'failed' THEN 1 ELSE 0 END`,
      ),
    })
    .from(payment)
    .innerJoin(user, eq(payment.userId, user.id))
    .where(whereClause);

  return NextResponse.json({
    data: payments,
    summary: {
      totalTransactions: summary.totalTransactions,
      totalRevenue: Number(summary.totalRevenue ?? 0),
      totalPending: Number(summary.totalPending ?? 0),
      successCount: Number(summary.successCount ?? 0),
      failedCount: Number(summary.failedCount ?? 0),
    },
  });
}
