import { db } from "@/lib/db/db";
import { systemUser, passwordResetToken } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json() as {
      token: string;
      password: string;
    };

    if (!token?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Token and password are required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    // Find a valid, unexpired, unused token
    const [resetRecord] = await db
      .select({
        id: passwordResetToken.id,
        email: passwordResetToken.email,
        expires: passwordResetToken.expires,
        usedAt: passwordResetToken.usedAt,
      })
      .from(passwordResetToken)
      .where(
        and(
          eq(passwordResetToken.token, token),
          gt(passwordResetToken.expires, new Date()),
        ),
      )
      .limit(1);

    if (!resetRecord) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 },
      );
    }

    if (resetRecord.usedAt) {
      return NextResponse.json(
        { error: "This reset link has already been used." },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    // Update password and mark token as used in parallel
    await Promise.all([
      db
        .update(systemUser)
        .set({ password: hashed, emailVerified: new Date() })
        .where(eq(systemUser.email, resetRecord.email)),

      db
        .update(passwordResetToken)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetToken.id, resetRecord.id)),
    ]);

    return NextResponse.json(
      { message: "Password updated successfully. You can now sign in." },
      { status: 200 },
    );
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

// GET - validate token without consuming it (used to pre-check before showing the form)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const [record] = await db
      .select({ id: passwordResetToken.id, usedAt: passwordResetToken.usedAt })
      .from(passwordResetToken)
      .where(
        and(
          eq(passwordResetToken.token, token),
          gt(passwordResetToken.expires, new Date()),
        ),
      )
      .limit(1);

    if (!record || record.usedAt) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/auth/reset-password]", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}