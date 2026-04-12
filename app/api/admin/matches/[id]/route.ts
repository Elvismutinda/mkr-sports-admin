import { db } from "@/lib/db/db";
import { match } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { logAction } from "@/lib/logger";
import { getActor } from "@/lib/auth/getActor";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.UPDATE_MATCH]);
  if (authError) return authError;
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  const allowed = [
    "date",
    "location",
    "mode",
    "price",
    "maxPlayers",
    "turfId",
    "tournamentId",
    "homeTeamId",
    "awayTeamId",
    "status",
    "completed",
    "score",
    "matchReport",
    "isPublic",
    "roundName",
  ] as const;
  for (const key of allowed) {
    if (!(key in body)) continue;
    update[key] = key === "date" && body[key] ? new Date(body[key]) : body[key];
  }
  await db.update(match).set(update).where(eq(match.id, id));

  const actor = await getActor(req);
  const isScoreUpdate = "score" in update && "completed" in update;
  logAction({
    actorId: actor?.id,
    actorType: "system_user",
    action: isScoreUpdate ? "RECORD_MATCH_SCORE" : "UPDATE_MATCH",
    entityType: "match",
    entityId: id,
    description: isScoreUpdate
      ? `Recorded score: ${JSON.stringify(update.score)}`
      : `Updated match fields: ${Object.keys(update).join(", ")}`,
    metadata: isScoreUpdate ? { score: update.score } : undefined,
    req,
  });

  return NextResponse.json({ message: "Match updated." });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.DELETE_MATCH]);
  if (authError) return authError;
  const { id } = await params;
  await db.update(match).set({ status: "CANCELLED" }).where(eq(match.id, id));
  const actor = await getActor(req);
  logAction({
    actorId: actor?.id,
    actorType: "system_user",
    action: "CANCEL_MATCH",
    entityType: "match",
    entityId: id,
    description: "Cancelled match",
    metadata: {
      before: { status: "active" },
      after: { status: "cancelled" },
    },
    req,
  });
  return NextResponse.json({ message: "Match cancelled." });
}
