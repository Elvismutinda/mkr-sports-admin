import { db } from "@/lib/db/db";
import { systemLog, partner } from "@/lib/db/schema";
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

    // Always scoped to partner actors only
    const conditions = [eq(systemLog.actorType, "partner")];

    if (q) {
      conditions.push(
        or(
          ilike(systemLog.action, `%${q}%`),
          ilike(systemLog.description, `%${q}%`),
          ilike(systemLog.entityType, `%${q}%`),
          ilike(systemLog.ipAddress, `%${q}%`),
        )!,
      );
    }
    if (entityType) conditions.push(eq(systemLog.entityType, entityType));
    if (action) conditions.push(ilike(systemLog.action, `%${action}%`));
    if (dateFrom) conditions.push(gte(systemLog.createdAt, new Date(dateFrom)));
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(systemLog.createdAt, end));
    }

    const whereClause = and(...conditions);

    const [logs, [{ total }], distinctActions, distinctEntityTypes] =
      await Promise.all([
        db
          .select({
            id: systemLog.id,
            actorId: systemLog.actorId,
            actorType: systemLog.actorType,
            actorName: partner.name,
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
          .leftJoin(
            partner,
            and(
              eq(systemLog.actorId, partner.id),
              sql`${systemLog.actorType} = 'partner'`,
            ),
          )
          .where(whereClause)
          .orderBy(desc(systemLog.createdAt))
          .limit(limit)
          .offset(offset),

        db.select({ total: count() }).from(systemLog).where(whereClause),

        db
          .selectDistinct({ action: systemLog.action })
          .from(systemLog)
          .where(eq(systemLog.actorType, "partner"))
          .orderBy(systemLog.action)
          .limit(200),

        db
          .selectDistinct({ entityType: systemLog.entityType })
          .from(systemLog)
          .where(
            and(
              eq(systemLog.actorType, "partner"),
              sql`${systemLog.entityType} IS NOT NULL`,
            ),
          )
          .orderBy(systemLog.entityType)
          .limit(100),
      ]);

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
    console.error("[GET /api/admin/partner-logs]", error);
    return NextResponse.json(
      { error: "Failed to fetch partner logs" },
      { status: 500 },
    );
  }
}
