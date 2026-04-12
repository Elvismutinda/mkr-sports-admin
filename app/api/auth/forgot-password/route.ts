import { db } from "@/lib/db/db";
import { systemUser, passwordResetToken } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { sendAdminPasswordResetEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email: string };

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const [user] = await db
      .select({ id: systemUser.id, name: systemUser.name, email: systemUser.email, status: systemUser.status })
      .from(systemUser)
      .where(eq(systemUser.email, email.trim().toLowerCase()))
      .limit(1);

    // Always return 200 to prevent email enumeration
    if (!user || user.status === "suspended") {
      return NextResponse.json(
        { message: "If an account exists with that email, a reset link has been sent." },
        { status: 200 },
      );
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Invalidate any existing tokens for this email
    await db
      .delete(passwordResetToken)
      .where(eq(passwordResetToken.email, user.email));

    await db.insert(passwordResetToken).values({
      email: user.email,
      token,
      expires,
    });

    await sendAdminPasswordResetEmail(user.email, user.name, token);

    return NextResponse.json(
      { message: "If an account exists with that email, a reset link has been sent." },
      { status: 200 },
    );
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}