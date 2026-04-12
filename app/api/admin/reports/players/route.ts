import { db } from "@/lib/db/db";
import { user } from "@/lib/db/schema";
import { eq, gte, lte, and, desc, count, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_REPORT]);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? "player"; // "player" | "agent"
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const isActive = searchParams.get("isActive");
  const limit = Math.min(500, parseInt(searchParams.get("limit") ?? "100", 10));

  const conditions = [];
  if (role === "player" || role === "agent")
    conditions.push(eq(user.role, role));
  if (isActive === "true") conditions.push(eq(user.isActive, true));
  if (isActive === "false") conditions.push(eq(user.isActive, false));
  if (dateFrom) conditions.push(gte(user.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(user.createdAt, new Date(dateTo)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const players = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      position: user.position,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      stats: user.stats,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(whereClause)
    .orderBy(desc(user.createdAt))
    .limit(limit);

  // Summary
  const [{ total }] = await db
    .select({ total: count() })
    .from(user)
    .where(whereClause);
  const [{ verified }] = await db
    .select({ verified: count() })
    .from(user)
    .where(
      conditions.length > 0
        ? and(...conditions, sql`${user.emailVerified} IS NOT NULL`)
        : sql`${user.emailVerified} IS NOT NULL`,
    );

  return NextResponse.json({
    data: players,
    summary: {
      total,
      verified,
      unverified: total - verified,
      active: players.filter((p) => p.isActive).length,
    },
  });
}
