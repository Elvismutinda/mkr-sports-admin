import { db } from "@/lib/db/db";
import { notification } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .update(notification)
    .set({ isRead: true })
    .where(
      and(
        eq(notification.userId, session.user.id),
        eq(notification.isRead, false),
      ),
    );

  return NextResponse.json({ message: "All notifications marked as read." });
}
