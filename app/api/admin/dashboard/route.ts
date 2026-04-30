import { db } from "@/lib/db/db";
import {
  user, turf, team, match, tournament,
  payment, systemLog,
  partner,
} from "@/lib/db/schema";
import { eq, count, sum, sql, gte, desc, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [
    Permission.DASHBOARD_CLIENTS,
    Permission.DASHBOARD_TRANSACTIONS,
    Permission.DASHBOARD_ANALYTICS,
  ]);
  if (authError) return authError;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
//   const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [
      // Totals
      [{ totalPlayers }],
      [{ totalPartners }],
      [{ totalTurfs }],
      [{ totalTeams }],
      [{ totalMatches }],
      [{ totalTournaments }],

      // This month
      [{ newPlayersThisMonth }],
      [{ newPlayersLastMonth }],

      // Payments
      [{ totalRevenue, revenueThisMonth, revenueLastMonth, pendingPayments, failedPayments }],

      // Match stats
      [{ upcomingMatches }],
      [{ liveMatches }],
      [{ completedMatchesThisMonth }],

      // Tournament stats
      [{ upcomingTournaments }],
      [{ ongoingTournaments }],

      // Registrations trend (last 30 days, daily)
      registrationTrend,

      // Revenue trend (last 30 days, daily)
      revenueTrend,

      // Top turfs by match count
      topTurfs,

      // Recent system activity
      recentLogs,

      // Match mode distribution
      matchModeDistribution,
    ] = await Promise.all([
      // Totals
      db.select({ totalPlayers: count() }).from(user).where(eq(user.role, "player")),
      db.select({ totalPartners: count() }).from(partner).where(eq(partner.role, "turf_manager")),
      db.select({ totalTurfs: count() }).from(turf).where(eq(turf.isActive, true)),
      db.select({ totalTeams: count() }).from(team).where(eq(team.isActive, true)),
      db.select({ totalMatches: count() }).from(match),
      db.select({ totalTournaments: count() }).from(tournament),

      // New players
      db.select({ newPlayersThisMonth: count() }).from(user).where(
        and(eq(user.role, "player"), gte(user.createdAt, startOfMonth)),
      ),
      db.select({ newPlayersLastMonth: count() }).from(user).where(
        and(eq(user.role, "player"), gte(user.createdAt, startOfLastMonth), sql`${user.createdAt} <= ${endOfLastMonth}`),
      ),

      // Payments
      db.select({
        totalRevenue: sum(sql<number>`CASE WHEN ${payment.status} = 'success' THEN ${payment.amount}::numeric ELSE 0 END`),
        revenueThisMonth: sum(sql<number>`CASE WHEN ${payment.status} = 'success' AND ${payment.createdAt} >= ${startOfMonth} THEN ${payment.amount}::numeric ELSE 0 END`),
        revenueLastMonth: sum(sql<number>`CASE WHEN ${payment.status} = 'success' AND ${payment.createdAt} >= ${startOfLastMonth} AND ${payment.createdAt} <= ${endOfLastMonth} THEN ${payment.amount}::numeric ELSE 0 END`),
        pendingPayments: sum(sql<number>`CASE WHEN ${payment.status} = 'pending' THEN 1 ELSE 0 END`),
        failedPayments: sum(sql<number>`CASE WHEN ${payment.status} = 'failed' THEN 1 ELSE 0 END`),
      }).from(payment),

      // Match status
      db.select({ upcomingMatches: count() }).from(match).where(eq(match.status, "UPCOMING")),
      db.select({ liveMatches: count() }).from(match).where(eq(match.status, "LIVE")),
      db.select({ completedMatchesThisMonth: count() }).from(match).where(
        and(eq(match.status, "COMPLETED"), gte(match.date, startOfMonth)),
      ),

      // Tournament status
      db.select({ upcomingTournaments: count() }).from(tournament).where(eq(tournament.status, "UPCOMING")),
      db.select({ ongoingTournaments: count() }).from(tournament).where(eq(tournament.status, "ONGOING")),

      // Daily registration trend
      db.select({
        date: sql<string>`DATE(${user.createdAt})`,
        count: count(),
      })
      .from(user)
      .where(and(eq(user.role, "player"), gte(user.createdAt, last30Days)))
      .groupBy(sql`DATE(${user.createdAt})`)
      .orderBy(sql`DATE(${user.createdAt})`),

      // Daily revenue trend
      db.select({
        date: sql<string>`DATE(${payment.createdAt})`,
        revenue: sum(sql<number>`${payment.amount}::numeric`),
      })
      .from(payment)
      .where(and(eq(payment.status, "success"), gte(payment.createdAt, last30Days)))
      .groupBy(sql`DATE(${payment.createdAt})`)
      .orderBy(sql`DATE(${payment.createdAt})`),

      // Top 5 turfs by match count
      db.select({
        turfId: match.turfId,
        turfName: turf.name,
        city: turf.city,
        matchCount: count(),
      })
      .from(match)
      .innerJoin(turf, eq(match.turfId, turf.id))
      .where(sql`${match.turfId} IS NOT NULL`)
      .groupBy(match.turfId, turf.name, turf.city)
      .orderBy(desc(count()))
      .limit(5),

      // Recent 8 system log entries
      db.select({
        id: systemLog.id,
        action: systemLog.action,
        entityType: systemLog.entityType,
        description: systemLog.description,
        createdAt: systemLog.createdAt,
      })
      .from(systemLog)
      .orderBy(desc(systemLog.createdAt))
      .limit(8),

      // Match mode distribution
      db.select({
        mode: match.mode,
        count: count(),
      })
      .from(match)
      .groupBy(match.mode)
      .orderBy(desc(count())),
    ]);

    // Percentage changes
    const playerGrowth = newPlayersLastMonth > 0
      ? Math.round(((newPlayersThisMonth - newPlayersLastMonth) / newPlayersLastMonth) * 100)
      : newPlayersThisMonth > 0 ? 100 : 0;

    const revenueGrowth = Number(revenueLastMonth ?? 0) > 0
      ? Math.round(((Number(revenueThisMonth ?? 0) - Number(revenueLastMonth ?? 0)) / Number(revenueLastMonth ?? 0)) * 100)
      : Number(revenueThisMonth ?? 0) > 0 ? 100 : 0;

    return NextResponse.json({
      totals: {
        players: totalPlayers,
        partners: totalPartners,
        turfs: totalTurfs,
        teams: totalTeams,
        matches: totalMatches,
        tournaments: totalTournaments,
      },
      players: {
        thisMonth: newPlayersThisMonth,
        lastMonth: newPlayersLastMonth,
        growth: playerGrowth,
      },
      revenue: {
        total: Number(totalRevenue ?? 0),
        thisMonth: Number(revenueThisMonth ?? 0),
        lastMonth: Number(revenueLastMonth ?? 0),
        growth: revenueGrowth,
        pendingPayments: Number(pendingPayments ?? 0),
        failedPayments: Number(failedPayments ?? 0),
      },
      matches: {
        upcoming: upcomingMatches,
        live: liveMatches,
        completedThisMonth: completedMatchesThisMonth,
      },
      tournaments: {
        upcoming: upcomingTournaments,
        ongoing: ongoingTournaments,
      },
      charts: {
        registrationTrend: registrationTrend.map((r) => ({ date: r.date, count: r.count })),
        revenueTrend: revenueTrend.map((r) => ({ date: r.date, revenue: Number(r.revenue ?? 0) })),
        matchModeDistribution: matchModeDistribution.map((m) => ({ mode: m.mode, count: m.count })),
      },
      topTurfs: topTurfs.map((t) => ({ name: t.turfName, city: t.city, matchCount: t.matchCount })),
      recentActivity: recentLogs,
    });
  } catch (error) {
    console.error("[GET /api/admin/dashboard]", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}