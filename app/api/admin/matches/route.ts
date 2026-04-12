import { db } from "@/lib/db/db";
import { match, turf, team, tournament } from "@/lib/db/schema";
import { eq, ilike, or, count, desc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { getActor } from "@/lib/auth/getActor";
import { logAction } from "@/lib/logger";

const homeTeam = db
  .select({ id: team.id, name: team.name })
  .from(team)
  .as("homeTeam");
const awayTeam = db
  .select({ id: team.id, name: team.name })
  .from(team)
  .as("awayTeam");

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_MATCH]);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
  );
  const offset = (page - 1) * limit;

  const conditions = [];
  if (q)
    conditions.push(
      or(ilike(match.location, `%${q}%`), ilike(match.mode, `%${q}%`)),
    );
  if (status) conditions.push(sql`${match.status} = ${status}`);
  const whereClause =
    conditions.length > 0
      ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
      : undefined;

  const turfAlias = db
    .select({ id: turf.id, name: turf.name })
    .from(turf)
    .as("turfAlias");
  const tournamentAlias = db
    .select({ id: tournament.id, name: tournament.name })
    .from(tournament)
    .as("tournamentAlias");

  const [matches, [{ total }]] = await Promise.all([
    db
      .select({
        id: match.id,
        date: match.date,
        location: match.location,
        turfId: match.turfId,
        turfName: turfAlias.name,
        tournamentId: match.tournamentId,
        tournamentName: tournamentAlias.name,
        homeTeamId: match.homeTeamId,
        homeTeamName: homeTeam.name,
        awayTeamId: match.awayTeamId,
        awayTeamName: awayTeam.name,
        mode: match.mode,
        price: match.price,
        maxPlayers: match.maxPlayers,
        registeredCount: sql<number>`jsonb_array_length(${match.registeredPlayerIds})`,
        status: match.status,
        completed: match.completed,
        score: match.score,
        matchReport: match.matchReport,
        isPublic: match.isPublic,
        roundName: match.roundName,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      })
      .from(match)
      .leftJoin(turfAlias, eq(match.turfId, turfAlias.id))
      .leftJoin(tournamentAlias, eq(match.tournamentId, tournamentAlias.id))
      .leftJoin(homeTeam, eq(match.homeTeamId, homeTeam.id))
      .leftJoin(awayTeam, eq(match.awayTeamId, awayTeam.id))
      .where(whereClause)
      .orderBy(desc(match.date))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(match).where(whereClause),
  ]);

  return NextResponse.json({
    data: matches,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.CREATE_MATCH]);
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      date: string;
      location: string;
      mode: string;
      price?: string;
      maxPlayers?: number;
      turfId?: string;
      tournamentId?: string;
      homeTeamId?: string;
      awayTeamId?: string;
      isPublic?: boolean;
      roundName?: string;
    };

    if (!body.date || !body.location?.trim() || !body.mode?.trim()) {
      return NextResponse.json(
        { error: "Date, location, and mode are required." },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(match)
      .values({
        date: new Date(body.date),
        location: body.location.trim(),
        mode: body.mode.trim(),
        price: body.price ?? "0.00",
        maxPlayers: body.maxPlayers ?? 14,
        turfId: body.turfId ?? null,
        tournamentId: body.tournamentId ?? null,
        homeTeamId: body.homeTeamId ?? null,
        awayTeamId: body.awayTeamId ?? null,
        isPublic: body.isPublic ?? true,
        roundName: body.roundName?.trim() ?? null,
        status: "UPCOMING",
      })
      .returning({ id: match.id, date: match.date, location: match.location });

    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "CREATE_MATCH",
      entityType: "match",
      entityId: created.id,
      description: `Created match at "${created.location}" on ${created.date}`,
      metadata: {
        before: null,
        after: { date: created.date, location: created.location },
      },
      req,
    });

    return NextResponse.json(
      { message: "Match created.", data: created },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/admin/matches]", error);
    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 },
    );
  }
}
