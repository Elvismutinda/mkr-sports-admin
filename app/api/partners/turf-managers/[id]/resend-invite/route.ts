import { db } from "@/lib/db/db";
import { partner, passwordResetToken } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { randomBytes } from "crypto";
import { sendPartnerInviteEmail } from "@/lib/mail";
import { getActor } from "@/lib/auth/getActor";
import { logAction } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAnyPermission(req, [Permission.UPDATE_USER]);
  if (authError) return authError;

  const { id } = await params;
  const [found] = await db
    .select({
      id: partner.id,
      name: partner.name,
      email: partner.email,
      role: partner.role,
    })
    .from(partner)
    .where(eq(partner.id, id))
    .limit(1);

  if (!found) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  // Invalidate all existing tokens for this email before issuing a new one
  await db
    .delete(passwordResetToken)
    .where(eq(passwordResetToken.email, found.email));

  const token = randomBytes(32).toString("hex");
  await db.insert(passwordResetToken).values({
    email: found.email,
    token,
    expires: new Date(Date.now() + 48 * 60 * 60 * 1000),
  });

  await sendPartnerInviteEmail(found.email, found.name, token, found.role);

  const actor = await getActor(req);
  logAction({
    actorId: actor?.id,
    actorType: "system_user",
    action: "RESEND_PARTNER_INVITE",
    entityType: "partner",
    entityId: found.id,
    description: `Resent invite to partner "${found.name}" (${found.email}) — role: ${found.role}`,
    req,
  });

  return NextResponse.json({ message: "Invite email resent." });
}
