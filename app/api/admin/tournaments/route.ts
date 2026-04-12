import { db } from "@/lib/db/db";
import { tournament, turf, tournamentParticipant } from "@/lib/db/schema";
import { eq, ilike, or, count, desc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { getActor } from "@/lib/auth/getActor";
import { logAction } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [
    Permission.VIEW_TOURNAMENT,
  ]);
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
      or(
        ilike(tournament.name, `%${q}%`),
        ilike(tournament.location, `%${q}%`),
      ),
    );
  if (status) conditions.push(sql`${tournament.status} = ${status}`);
  const whereClause =
    conditions.length > 0
      ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
      : undefined;

  const [tournaments, [{ total }]] = await Promise.all([
    db
      .select({
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        location: tournament.location,
        turfId: tournament.turfId,
        turfName: turf.name,
        prizePool: tournament.prizePool,
        entryFee: tournament.entryFee,
        maxTeams: tournament.maxTeams,
        maxPlayersPerTeam: tournament.maxPlayersPerTeam,
        format: tournament.format,
        status: tournament.status,
        startsAt: tournament.startsAt,
        endsAt: tournament.endsAt,
        registrationDeadline: tournament.registrationDeadline,
        rules: tournament.rules,
        isPublic: tournament.isPublic,
        participantCount: count(tournamentParticipant.id),
        createdAt: tournament.createdAt,
        updatedAt: tournament.updatedAt,
      })
      .from(tournament)
      .leftJoin(turf, eq(tournament.turfId, turf.id))
      .leftJoin(
        tournamentParticipant,
        eq(tournamentParticipant.tournamentId, tournament.id),
      )
      .where(whereClause)
      .groupBy(tournament.id, turf.name)
      .orderBy(desc(tournament.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(tournament).where(whereClause),
  ]);

  return NextResponse.json({
    data: tournaments,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const authError = await requireAnyPermission(req, [
    Permission.CREATE_TOURNAMENT,
  ]);
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      name: string;
      description?: string;
      location?: string;
      turfId?: string;
      prizePool?: string;
      entryFee?: string;
      maxTeams?: number;
      maxPlayersPerTeam?: number;
      format?: "LEAGUE" | "KNOCKOUT" | "GROUP_STAGE_KNOCKOUT" | "ROUND_ROBIN";
      startsAt?: string;
      endsAt?: string;
      registrationDeadline?: string;
      rules?: string;
      isPublic?: boolean;
    };

    if (!body.name?.trim())
      return NextResponse.json(
        { error: "Tournament name is required." },
        { status: 400 },
      );

    const [created] = await db
      .insert(tournament)
      .values({
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        location: body.location?.trim() ?? null,
        turfId: body.turfId ?? null,
        prizePool: body.prizePool ?? "0.00",
        entryFee: body.entryFee ?? "0.00",
        maxTeams: body.maxTeams ?? null,
        maxPlayersPerTeam: body.maxPlayersPerTeam ?? null,
        format: body.format ?? "KNOCKOUT",
        status: "UPCOMING",
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        registrationDeadline: body.registrationDeadline
          ? new Date(body.registrationDeadline)
          : null,
        rules: body.rules?.trim() ?? null,
        isPublic: body.isPublic ?? true,
      })
      .returning({ id: tournament.id, name: tournament.name });

    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "CREATE_TOURNAMENT",
      entityType: "tournament",
      entityId: created.id,
      description: `Created tournament "${created.name}"`,
      metadata: {
        before: null,
        after: { name: created.name },
      },
      req,
    });

    return NextResponse.json(
      { message: "Tournament created.", data: created },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/admin/tournaments]", error);
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 },
    );
  }
}
