import { db } from "@/lib/db/db";
import { user, turf, team, match, tournament, payment } from "@/lib/db/schema";
import { eq, count, and, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Returns counts for sidebar badges.
 * Each count represents something "needing attention":
 *  - users: registered but not yet email-verified players
 *  - turfs: inactive turfs (pending review)
 *  - teams: teams with no captain assigned
 *  - tournaments: UPCOMING tournaments starting within 7 days
 *  - matches: UPCOMING matches today
 *  - payments: pending payments
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const [
      [{ unverifiedPlayers }],
      [{ inactiveTurfs }],
      [{ captainlesTeams }],
      [{ upcomingTournaments }],
      [{ todayMatches }],
      [{ pendingPayments }],
    ] = await Promise.all([
      // Unverified players
      db
        .select({ unverifiedPlayers: count() })
        .from(user)
        .where(
          and(
            eq(user.role, "player"),
            eq(user.isActive, true),
            sql`${user.emailVerified} IS NULL`,
          ),
        ),

      // Inactive turfs needing review
      db
        .select({ inactiveTurfs: count() })
        .from(turf)
        .where(eq(turf.isActive, false)),

      // Teams without captains
      db
        .select({ captainlesTeams: count() })
        .from(team)
        .where(and(eq(team.isActive, true), sql`${team.captainId} IS NULL`)),

      // Tournaments starting in next 7 days
      db
        .select({ upcomingTournaments: count() })
        .from(tournament)
        .where(
          and(
            eq(tournament.status, "UPCOMING"),
            gte(tournament.startsAt, now),
            sql`${tournament.startsAt} <= ${in7Days}`,
          ),
        ),

      // Matches happening today
      db
        .select({ todayMatches: count() })
        .from(match)
        .where(
          and(
            eq(match.status, "UPCOMING"),
            gte(match.date, now),
            sql`${match.date} <= ${todayEnd}`,
          ),
        ),

      // Pending payments
      db
        .select({ pendingPayments: count() })
        .from(payment)
        .where(eq(payment.status, "pending")),
    ]);

    return NextResponse.json({
      users: unverifiedPlayers,
      turfs: inactiveTurfs,
      teams: captainlesTeams,
      tournaments: upcomingTournaments,
      matches: todayMatches,
      payments: pendingPayments,
    });
  } catch (error) {
    console.error("[GET /api/admin/notifications/module-counts]", error);
    return NextResponse.json(
      { error: "Failed to fetch counts" },
      { status: 500 },
    );
  }
}
