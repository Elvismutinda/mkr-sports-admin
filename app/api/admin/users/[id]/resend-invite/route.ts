import { db } from "@/lib/db/db";
import { user, passwordResetToken } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { randomBytes } from "crypto";
import { sendAgentInviteEmail } from "@/lib/mail";
import { getActor } from "@/lib/auth/getActor";
import { logAction } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.UPDATE_USER]);
  if (authError) return authError;

  try {
    const { id } = await params;

    const [agent] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!agent) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (agent.role !== "agent") {
      return NextResponse.json(
        { error: "Invite emails can only be resent to agents." },
        { status: 400 },
      );
    }

    // Invalidate old tokens and issue a fresh one
    await db
      .delete(passwordResetToken)
      .where(eq(passwordResetToken.email, agent.email));

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await db.insert(passwordResetToken).values({
      email: agent.email,
      token,
      expires,
    });

    await sendAgentInviteEmail(agent.email, agent.name, token);

    const actor = await getActor(req);
    logAction({
      actorId: actor?.id,
      actorType: "system_user",
      action: "RESEND_AGENT_INVITE",
      entityType: "user",
      entityId: agent.id,
      description: `Resent invite email to agent "${agent.name}" (${agent.email})`,
      req,
    });

    return NextResponse.json(
      { message: "Invite email resent successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("[POST /api/admin/users/:id/resend-invite]", error);
    return NextResponse.json(
      { error: "Failed to resend invite." },
      { status: 500 },
    );
  }
}
