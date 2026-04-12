import { db } from "@/lib/db/db";
import { notification } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db
    .update(notification)
    .set({ isRead: true })
    .where(
      and(eq(notification.id, id), eq(notification.userId, session.user.id)),
    );

  return NextResponse.json({ message: "Marked as read." });
}
