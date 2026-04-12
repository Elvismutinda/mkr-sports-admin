import { db } from "@/lib/db/db";
import { notification } from "@/lib/db/schema";
import { eq, desc, count, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const offset = (page - 1) * limit;
    const unreadOnly = searchParams.get("unread") === "true";

    // Admin notifications are those sent to the acting system user.
    // For the notification bell we re-use the `notification` table but scope
    // to the system user's email via the users table (if they have a player
    // account) OR we simply query all notifications for now and filter by
    // the session user ID once we have a mapping. For pure admin-side we
    // store notifications addressed to a user row that matches the admin email.
    const where = unreadOnly
      ? and(
          eq(notification.userId, session.user.id),
          eq(notification.isRead, false),
        )
      : eq(notification.userId, session.user.id);

    const [notifications, [{ total }], [{ unreadCount }]] = await Promise.all([
      db
        .select({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          isRead: notification.isRead,
          entityType: notification.entityType,
          entityId: notification.entityId,
          createdAt: notification.createdAt,
        })
        .from(notification)
        .where(where)
        .orderBy(desc(notification.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ total: count() }).from(notification).where(where),
      db
        .select({ unreadCount: count() })
        .from(notification)
        .where(
          and(
            eq(notification.userId, session.user.id),
            eq(notification.isRead, false),
          ),
        ),
    ]);

    return NextResponse.json({
      data: notifications,
      unreadCount,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/admin/notifications]", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
