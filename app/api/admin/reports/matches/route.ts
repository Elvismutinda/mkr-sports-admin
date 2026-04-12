import { db } from "@/lib/db/db";
import { match, turf, team, tournament } from "@/lib/db/schema";
import { eq, gte, lte, and, desc, count, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_REPORT]);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const mode = searchParams.get("mode");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const tournamentId = searchParams.get("tournamentId");
  const limit = Math.min(500, parseInt(searchParams.get("limit") ?? "100", 10));

  const conditions = [];
  if (status) conditions.push(sql`${match.status} = ${status}`);
  if (mode) conditions.push(sql`${match.mode} = ${mode}`);
  if (dateFrom) conditions.push(gte(match.date, new Date(dateFrom)));
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(match.date, end));
  }
  if (tournamentId) conditions.push(eq(match.tournamentId, tournamentId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const homeTeamAlias = db
    .select({ id: team.id, name: team.name })
    .from(team)
    .as("ht");
  const awayTeamAlias = db
    .select({ id: team.id, name: team.name })
    .from(team)
    .as("at");
  const turfAlias = db
    .select({ id: turf.id, name: turf.name })
    .from(turf)
    .as("ta");
  const tournamentAlias = db
    .select({ id: tournament.id, name: tournament.name })
    .from(tournament)
    .as("ta2");

  const matches = await db
    .select({
      id: match.id,
      date: match.date,
      location: match.location,
      mode: match.mode,
      status: match.status,
      score: match.score,
      completed: match.completed,
      maxPlayers: match.maxPlayers,
      registeredCount: sql<number>`jsonb_array_length(${match.registeredPlayerIds})`,
      price: match.price,
      homeTeamName: homeTeamAlias.name,
      awayTeamName: awayTeamAlias.name,
      turfName: turfAlias.name,
      tournamentName: tournamentAlias.name,
      roundName: match.roundName,
      createdAt: match.createdAt,
    })
    .from(match)
    .leftJoin(homeTeamAlias, eq(match.homeTeamId, homeTeamAlias.id))
    .leftJoin(awayTeamAlias, eq(match.awayTeamId, awayTeamAlias.id))
    .leftJoin(turfAlias, eq(match.turfId, turfAlias.id))
    .leftJoin(tournamentAlias, eq(match.tournamentId, tournamentAlias.id))
    .where(whereClause)
    .orderBy(desc(match.date))
    .limit(limit);

  const [{ total }] = await db
    .select({ total: count() })
    .from(match)
    .where(whereClause);
  const completed = matches.filter((m) => m.completed).length;
  const totalRevenue = matches.reduce(
    (sum, m) => sum + m.registeredCount * Number(m.price),
    0,
  );

  return NextResponse.json({
    data: matches,
    summary: {
      total,
      completed,
      upcoming: matches.filter((m) => m.status === "UPCOMING").length,
      live: matches.filter((m) => m.status === "LIVE").length,
      cancelled: matches.filter((m) => m.status === "CANCELLED").length,
      totalRevenue,
    },
  });
}
