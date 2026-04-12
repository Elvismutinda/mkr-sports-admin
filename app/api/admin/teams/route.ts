// api/admin/teams/route.ts
import { db } from "@/lib/db/db";
import { team, user, teamMember } from "@/lib/db/schema";
import { eq, ilike, or, count, desc, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { getActor } from "@/lib/auth/getActor";
import { logAction } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_TEAM]);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
  );
  const offset = (page - 1) * limit;
  const whereClause =
    q.length > 0
      ? or(ilike(team.name, `%${q}%`), ilike(team.type, `%${q}%`))
      : undefined;

  const [teams, [{ total }]] = await Promise.all([
    db
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
        memberCount: count(teamMember.id),
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })
      .from(team)
      .leftJoin(user, eq(team.captainId, user.id))
      .leftJoin(
        teamMember,
        and(eq(teamMember.teamId, team.id), eq(teamMember.isActive, true)),
      )
      .where(whereClause)
      .groupBy(team.id, user.name)
      .orderBy(desc(team.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(team).where(whereClause),
  ]);

  return NextResponse.json({
    data: teams,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.CREATE_TEAM]);
  if (authError) return authError;

  try {
    const { name, type, bio, badgeFallback } = (await req.json()) as {
      name: string;
      type?: string;
      bio?: string;
      badgeFallback?: string;
    };
    if (!name?.trim())
      return NextResponse.json(
        { error: "Team name is required." },
        { status: 400 },
      );
    const [created] = await db
      .insert(team)
      .values({
        name: name.trim(),
        type: type?.trim() ?? null,
        bio: bio?.trim() ?? null,
        badgeFallback: badgeFallback?.trim().slice(0, 8) ?? null,
        isActive: true,
      })
      .returning({ id: team.id, name: team.name });

    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "CREATE_TEAM",
      entityType: "team",
      entityId: created.id,
      description: `Created team "${created.name}"`,
      metadata: {
        before: null,
        after: { name: created.name },
      },
      req,
    });

    return NextResponse.json(
      { message: "Team created.", data: created },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/admin/teams]", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 },
    );
  }
}
