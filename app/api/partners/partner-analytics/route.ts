import { db } from "@/lib/db/db";
import { partner, turf, kycSubmission, systemLog } from "@/lib/db/schema";
import { eq, and, gte, lte, count, sql, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

// ── Row shapes for raw SQL results ────────────────────────────────────────────

interface GrowthTrendRow {
  month: string;
  count: string | number;
}
interface LoginTrendRow {
  day: string;
  count: string | number;
}
interface KycFunnelRow {
  status: string;
  count: string | number;
}
interface StatusDistRow {
  status: string;
  count: string | number;
}
interface RoleDistRow {
  role: string;
  count: string | number;
}

/**
 *
 * Returns aggregated analytics for the partner management section:
 *  - Summary KPIs
 *  - Partner growth over time (last 12 months)
 *  - KYC funnel breakdown
 *  - Partner status distribution
 *  - Top partners by turf count
 *  - Partner role distribution
 *  - Recent partner activity (from system_logs)
 */
export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.SUPER_ADMIN]);
  if (authError) return authError;

  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const prevThirtyStart = new Date(thirtyDaysAgo);
    prevThirtyStart.setDate(prevThirtyStart.getDate() - 30);

    // ── KPI counts ─────────────────────────────────────────────────────────

    const [
      [{ totalPartners }],
      [{ activePartners }],
      [{ suspendedPartners }],
      [{ totalTurfs }],
      [{ activeTurfs }],
      [{ pendingKyc }],
      [{ approvedKyc }],
      [{ newThisMonth }],
      [{ newLastMonth }],
    ] = await Promise.all([
      db.select({ totalPartners: count() }).from(partner),
      db
        .select({ activePartners: count() })
        .from(partner)
        .where(eq(partner.status, "active")),
      db
        .select({ suspendedPartners: count() })
        .from(partner)
        .where(eq(partner.status, "suspended")),
      db.select({ totalTurfs: count() }).from(turf),
      db
        .select({ activeTurfs: count() })
        .from(turf)
        .where(eq(turf.isActive, true)),
      db
        .select({ pendingKyc: count() })
        .from(kycSubmission)
        .where(eq(kycSubmission.status, "pending")),
      db
        .select({ approvedKyc: count() })
        .from(kycSubmission)
        .where(eq(kycSubmission.status, "approved")),
      db
        .select({ newThisMonth: count() })
        .from(partner)
        .where(gte(partner.createdAt, thirtyDaysAgo)),
      db
        .select({ newLastMonth: count() })
        .from(partner)
        .where(
          and(
            gte(partner.createdAt, prevThirtyStart),
            lte(partner.createdAt, thirtyDaysAgo),
          ),
        ),
    ]);

    const partnerGrowth =
      newLastMonth === 0
        ? 100
        : Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100);

    // ── Partner growth trend (last 12 months) ──────────────────────────────

    const growthTrend = await db.execute(sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') AS month,
        DATE_TRUNC('month', created_at) AS month_date,
        COUNT(*) AS count
      FROM partners
      WHERE created_at >= ${twelveMonthsAgo}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month_date ASC
    `);

    // ── KYC funnel ─────────────────────────────────────────────────────────

    const kycFunnel = await db.execute(sql`
      SELECT status, COUNT(*) AS count
      FROM kyc_submissions
      GROUP BY status
      ORDER BY count DESC
    `);

    // ── Partner status distribution ────────────────────────────────────────

    const statusDist = await db.execute(sql`
      SELECT status, COUNT(*) AS count
      FROM partners
      GROUP BY status
    `);

    // ── Top partners by turf count ─────────────────────────────────────────

    const topPartners = await db
      .select({
        partnerId: partner.id,
        partnerName: partner.name,
        businessName: partner.businessName,
        email: partner.email,
        status: partner.status,
        turfCount: count(turf.id),
      })
      .from(partner)
      .leftJoin(turf, eq(turf.partnerId, partner.id))
      .groupBy(
        partner.id,
        partner.name,
        partner.businessName,
        partner.email,
        partner.status,
      )
      .orderBy(desc(count(turf.id)))
      .limit(8);

    // ── Partner role distribution ──────────────────────────────────────────

    const roleDist = await db.execute(sql`
      SELECT role, COUNT(*) AS count
      FROM partners
      GROUP BY role
    `);

    // ── Recent partner activity (last 30 days) ─────────────────────────────

    const recentActivity = await db
      .select({
        id: systemLog.id,
        action: systemLog.action,
        description: systemLog.description,
        createdAt: systemLog.createdAt,
        actorName: partner.name,
      })
      .from(systemLog)
      .leftJoin(
        partner,
        and(
          eq(systemLog.actorId, partner.id),
          sql`${systemLog.actorType} = 'partner'`,
        ),
      )
      .where(
        and(
          sql`${systemLog.actorType} = 'partner'`,
          gte(systemLog.createdAt, thirtyDaysAgo),
        ),
      )
      .orderBy(desc(systemLog.createdAt))
      .limit(10);

    // ── Daily logins last 30 days ──────────────────────────────────────────

    const loginTrend = await db.execute(sql`
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'DD Mon') AS day,
        DATE_TRUNC('day', created_at) AS day_date,
        COUNT(*) AS count
      FROM system_logs
      WHERE
        actor_type = 'partner'
        AND action = 'LOGIN'
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY day_date ASC
    `);

    return NextResponse.json({
      kpis: {
        totalPartners,
        activePartners,
        suspendedPartners,
        inactivePartners: totalPartners - activePartners - suspendedPartners,
        totalTurfs,
        activeTurfs,
        pendingKyc,
        approvedKyc,
        newThisMonth,
        newLastMonth,
        partnerGrowth,
      },
      growthTrend: (growthTrend.rows as unknown as GrowthTrendRow[]).map(
        (r) => ({
          month: r.month,
          count: Number(r.count),
        }),
      ),
      loginTrend: (loginTrend.rows as unknown as LoginTrendRow[]).map((r) => ({
        day: r.day,
        count: Number(r.count),
      })),
      kycFunnel: (kycFunnel.rows as unknown as KycFunnelRow[]).map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      statusDist: (statusDist.rows as unknown as StatusDistRow[]).map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      roleDist: (roleDist.rows as unknown as RoleDistRow[]).map((r) => ({
        role: r.role,
        count: Number(r.count),
      })),
      topPartners,
      recentActivity: recentActivity.map((r) => ({
        id: r.id,
        action: r.action,
        description: r.description,
        createdAt: r.createdAt,
        actorName: r.actorName,
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/partner-analytics]", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
