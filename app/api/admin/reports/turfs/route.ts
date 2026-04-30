import { db } from "@/lib/db/db";
import { turf, match, user, partner } from "@/lib/db/schema";
import { eq, gte, lte, and, desc, count, sql, sum } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [Permission.VIEW_REPORT]);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const surface = searchParams.get("surface");
  const isActive = searchParams.get("isActive");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const turfConditions = [];
  if (city)
    turfConditions.push(
      sql`LOWER(${turf.city}) LIKE LOWER(${"%" + city + "%"})`,
    );
  if (surface) turfConditions.push(sql`${turf.surface} = ${surface}`);
  if (isActive === "true") turfConditions.push(eq(turf.isActive, true));
  if (isActive === "false") turfConditions.push(eq(turf.isActive, false));
  const turfWhere =
    turfConditions.length > 0 ? and(...turfConditions) : undefined;

  const turfs = await db
    .select({
      id: turf.id,
      name: turf.name,
      city: turf.city,
      area: turf.area,
      surface: turf.surface,
      pricePerHour: turf.pricePerHour,
      capacity: turf.capacity,
      rating: turf.rating,
      totalReviews: turf.totalReviews,
      isActive: turf.isActive,
      partnerName: partner.name,
    })
    .from(turf)
    .leftJoin(user, eq(turf.partnerId, user.id))
    .where(turfWhere)
    .orderBy(desc(turf.createdAt));

  // For each turf, count matches in date range
  const matchConditions = [];
  if (dateFrom) matchConditions.push(gte(match.date, new Date(dateFrom)));
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    matchConditions.push(lte(match.date, end));
  }

  const matchCounts = await db
    .select({
      turfId: match.turfId,
      matchCount: count(),
      completedCount: sum(
        sql<number>`CASE WHEN ${match.completed} THEN 1 ELSE 0 END`,
      ),
    })
    .from(match)
    .where(matchConditions.length > 0 ? and(...matchConditions) : undefined)
    .groupBy(match.turfId);

  const matchCountMap = Object.fromEntries(
    matchCounts.map((m) => [
      m.turfId,
      {
        matchCount: m.matchCount,
        completedCount: Number(m.completedCount ?? 0),
      },
    ]),
  );

  const enriched = turfs.map((t) => ({
    ...t,
    matchCount: matchCountMap[t.id]?.matchCount ?? 0,
    completedMatchCount: matchCountMap[t.id]?.completedCount ?? 0,
  }));

  return NextResponse.json({
    data: enriched,
    summary: {
      total: turfs.length,
      active: turfs.filter((t) => t.isActive).length,
      inactive: turfs.filter((t) => !t.isActive).length,
      totalMatches: matchCounts.reduce((s, m) => s + m.matchCount, 0),
    },
  });
}
