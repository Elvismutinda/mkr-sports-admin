import { db } from "@/lib/db/db";
import { tournament } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { getActor } from "@/lib/auth/getActor";
import { logAction } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [
    Permission.UPDATE_TOURNAMENT,
  ]);
  if (authError) return authError;
  const { id } = await params;
  const body = await req.json();

  const [existing] = await db
    .select({
      name: tournament.name,
      description: tournament.description,
      location: tournament.location,
      turfId: tournament.turfId,
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
    })
    .from(tournament)
    .where(eq(tournament.id, id))
    .limit(1);

  if (!existing)
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 },
    );

  const allowed = [
    "name",
    "description",
    "location",
    "turfId",
    "prizePool",
    "entryFee",
    "maxTeams",
    "maxPlayersPerTeam",
    "format",
    "status",
    "startsAt",
    "endsAt",
    "registrationDeadline",
    "rules",
    "isPublic",
  ] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (!(key in body)) continue;
    update[key] = ["startsAt", "endsAt", "registrationDeadline"].includes(key)
      ? body[key]
        ? new Date(body[key])
        : null
      : body[key];
  }
  await db.update(tournament).set(update).where(eq(tournament.id, id));

  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  for (const key of Object.keys(update)) {
    const prev = (existing as Record<string, unknown>)[key];
    changedBefore[key] = prev instanceof Date ? prev.toISOString() : prev;
    changedAfter[key] =
      update[key] instanceof Date
        ? (update[key] as Date).toISOString()
        : update[key];
  }

  const actor = await getActor(req);
  logAction({
    actorId: actor?.id,
    actorType: "system_user",
    action: "UPDATE_TOURNAMENT",
    entityType: "tournament",
    entityId: id,
    description: `Updated tournament "${existing.name}": ${Object.keys(update).join(", ")}`,
    metadata: { before: changedBefore, after: changedAfter },
    req,
  });
  return NextResponse.json({ message: "Tournament updated." });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [
    Permission.DELETE_TOURNAMENT,
  ]);
  if (authError) return authError;
  const { id } = await params;
  const [existing] = await db
    .select({ name: tournament.name, status: tournament.status })
    .from(tournament)
    .where(eq(tournament.id, id))
    .limit(1);
  await db
    .update(tournament)
    .set({ status: "COMPLETED" })
    .where(eq(tournament.id, id));
  const actor = await getActor(req);
  logAction({
    actorId: actor?.id,
    actorType: "system_user",
    action: "CANCEL_TOURNAMENT",
    entityType: "tournament",
    entityId: id,
    description: `Cancelled tournament "${existing?.name}"`,
    metadata: {
      before: { status: existing?.status },
      after: { status: "COMPLETED" },
    },
    req,
  });
  return NextResponse.json({ message: "Tournament cancelled." });
}
