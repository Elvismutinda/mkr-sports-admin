import { db } from "@/lib/db/db";
import { team, user, teamMember } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { getActor } from "@/lib/auth/getActor";
import { logAction } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_TEAM]);
  if (authError) return authError;
  const { id } = await params;

  const [found] = await db
    .select({
      id: team.id,
      name: team.name,
      badgeUrl: team.badgeUrl,
      badgeFallback: team.badgeFallback,
      type: team.type,
      bio: team.bio,
      captainId: team.captainId,
      captainName: user.name,
      stats: team.stats,
      isActive: team.isActive,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    })
    .from(team)
    .leftJoin(user, eq(team.captainId, user.id))
    .where(eq(team.id, id))
    .limit(1);

  if (!found)
    return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const members = await db
    .select({
      id: user.id,
      name: user.name,
      position: user.position,
      avatarUrl: user.avatarUrl,
      jerseyNumber: teamMember.jerseyNumber,
    })
    .from(teamMember)
    .innerJoin(user, eq(teamMember.playerId, user.id))
    .where(and(eq(teamMember.teamId, id), eq(teamMember.isActive, true)));

  return NextResponse.json({ ...found, members });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.UPDATE_TEAM]);
  if (authError) return authError;
  const { id } = await params;
  const body = await req.json();
  const allowed = [
    "name",
    "type",
    "bio",
    "badgeFallback",
    "captainId",
    "isActive",
    "stats",
  ] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  await db.update(team).set(update).where(eq(team.id, id));

  const actor = await getActor(req);
  logAction({
    actorId: actor?.id,
    actorType: "system_user",
    action: "UPDATE_TEAM",
    entityType: "team",
    entityId: id,
    description: `Updated team fields: ${Object.keys(update).join(", ")}`,
    req,
  });

  return NextResponse.json({ message: "Team updated." });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.DELETE_TEAM]);
  if (authError) return authError;
  const { id } = await params;
  await db.update(team).set({ isActive: false }).where(eq(team.id, id));

  const actor = await getActor(req);
  logAction({
    actorId: actor?.id,
    actorType: "system_user",
    action: "DEACTIVATE_TEAM",
    entityType: "team",
    entityId: id,
    description: "Deactivated team",
    metadata: {
      before: { status: "active" },
      after: { status: "suspended" },
    },
    req,
  });

  return NextResponse.json({ message: "Team deactivated." });
}
