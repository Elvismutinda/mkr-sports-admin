import { db } from "@/lib/db/db";
import { systemLog, systemUser } from "@/lib/db/schema";
import { eq, ilike, or, count, desc, and, gte, lte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

export async function GET(req: NextRequest) {
  const authError = await requireAnyPermission(req, [
    Permission.VIEW_SYSTEM_LOG,
  ]);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const actorType = searchParams.get("actorType"); // "system_user" | "user"
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
    );
    const offset = (page - 1) * limit;

    const conditions = [];

    if (q) {
      conditions.push(
        or(
          ilike(systemLog.action, `%${q}%`),
          ilike(systemLog.description, `%${q}%`),
          ilike(systemLog.entityType, `%${q}%`),
          ilike(systemLog.ipAddress, `%${q}%`),
        ),
      );
    }
    if (actorType) conditions.push(eq(systemLog.actorType, actorType));
    if (entityType) conditions.push(eq(systemLog.entityType, entityType));
    if (action) conditions.push(ilike(systemLog.action, `%${action}%`));
    if (dateFrom) conditions.push(gte(systemLog.createdAt, new Date(dateFrom)));
    if (dateTo) {
      // Include the full day
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(systemLog.createdAt, end));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, [{ total }]] = await Promise.all([
      db
        .select({
          id: systemLog.id,
          actorId: systemLog.actorId,
          actorType: systemLog.actorType,
          actorName: systemUser.name,
          action: systemLog.action,
          entityType: systemLog.entityType,
          entityId: systemLog.entityId,
          description: systemLog.description,
          ipAddress: systemLog.ipAddress,
          userAgent: systemLog.userAgent,
          metadata: systemLog.metadata,
          createdAt: systemLog.createdAt,
        })
        .from(systemLog)
        // Only left-join system users (player/agent actors won't have a match here)
        .leftJoin(
          systemUser,
          and(
            eq(systemLog.actorId, systemUser.id),
            sql`${systemLog.actorType} = 'system_user'`,
          ),
        )
        .where(whereClause)
        .orderBy(desc(systemLog.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ total: count() }).from(systemLog).where(whereClause),
    ]);

    // Derive distinct action list for filter dropdown (from current result set)
    const distinctActions = await db
      .selectDistinct({ action: systemLog.action })
      .from(systemLog)
      .orderBy(systemLog.action)
      .limit(200);

    const distinctEntityTypes = await db
      .selectDistinct({ entityType: systemLog.entityType })
      .from(systemLog)
      .where(sql`${systemLog.entityType} IS NOT NULL`)
      .orderBy(systemLog.entityType)
      .limit(100);

    return NextResponse.json({
      data: logs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      meta: {
        actions: distinctActions.map((r) => r.action).filter(Boolean),
        entityTypes: distinctEntityTypes
          .map((r) => r.entityType)
          .filter(Boolean),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/system-logs]", error);
    return NextResponse.json(
      { error: "Failed to fetch system logs" },
      { status: 500 },
    );
  }
}
