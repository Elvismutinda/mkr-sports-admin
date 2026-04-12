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
  const update: Record<string, unknown> = {};
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
  for (const key of allowed) {
    if (!(key in body)) continue;
    if (["startsAt", "endsAt", "registrationDeadline"].includes(key)) {
      update[key] = body[key] ? new Date(body[key]) : null;
    } else {
      update[key] = body[key];
    }
  }
  await db.update(tournament).set(update).where(eq(tournament.id, id));

  const actor = await getActor(req);
  logAction({
    actorId: actor?.id,
    actorType: "system_user",
    action: "UPDATE_TOURNAMENT",
    entityType: "tournament",
    entityId: id,
    description: `Updated tournament fields: ${Object.keys(update).join(", ")}`,
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
  // Soft cancel rather than delete
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
    description: "Cancelled tournament (set to COMPLETED)",
    metadata: {
      before: { status: "active" },
      after: { status: "cancelled" },
    },
    req,
  });
  return NextResponse.json({ message: "Tournament cancelled." });
}
