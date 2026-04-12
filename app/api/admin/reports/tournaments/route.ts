import { db } from "@/lib/db/db";
import {
  tournament,
  tournamentParticipant,
  tournamentTeam,
  turf,
} from "@/lib/db/schema";
import { eq, gte, lte, and, desc, count, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_REPORT]);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const format = searchParams.get("format");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const conditions = [];
  if (status) conditions.push(sql`${tournament.status} = ${status}`);
  if (format) conditions.push(sql`${tournament.format} = ${format}`);
  if (dateFrom) conditions.push(gte(tournament.startsAt, new Date(dateFrom)));
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(tournament.startsAt, end));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const tournaments = await db
    .select({
      id: tournament.id,
      name: tournament.name,
      format: tournament.format,
      status: tournament.status,
      prizePool: tournament.prizePool,
      entryFee: tournament.entryFee,
      maxTeams: tournament.maxTeams,
      startsAt: tournament.startsAt,
      endsAt: tournament.endsAt,
      isPublic: tournament.isPublic,
      turfName: turf.name,
      participantCount: count(tournamentParticipant.id),
    })
    .from(tournament)
    .leftJoin(turf, eq(tournament.turfId, turf.id))
    .leftJoin(
      tournamentParticipant,
      eq(tournamentParticipant.tournamentId, tournament.id),
    )
    .where(whereClause)
    .groupBy(tournament.id, turf.name)
    .orderBy(desc(tournament.createdAt));

  // Team counts
  const teamCounts = await db
    .select({ tournamentId: tournamentTeam.tournamentId, teamCount: count() })
    .from(tournamentTeam)
    .groupBy(tournamentTeam.tournamentId);
  const teamCountMap = Object.fromEntries(
    teamCounts.map((t) => [t.tournamentId, t.teamCount]),
  );

  const enriched = tournaments.map((t) => ({
    ...t,
    teamCount: teamCountMap[t.id] ?? 0,
    estimatedRevenue: t.entryFee
      ? (teamCountMap[t.id] ?? 0) * Number(t.entryFee)
      : 0,
  }));

  return NextResponse.json({
    data: enriched,
    summary: {
      total: tournaments.length,
      upcoming: tournaments.filter((t) => t.status === "UPCOMING").length,
      ongoing: tournaments.filter((t) => t.status === "ONGOING").length,
      completed: tournaments.filter((t) => t.status === "COMPLETED").length,
      totalPrizePool: tournaments.reduce(
        (s, t) => s + Number(t.prizePool ?? 0),
        0,
      ),
    },
  });
}
