import { db } from "@/lib/db/db";
import { permission } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

export async function GET(req: NextRequest) {
  const authError = await requirePermission(req, Permission.VIEW_ROLE);
  if (authError) return authError;

  try {
    const perms = await db
      .select({ id: permission.id, key: permission.key, group: permission.group })
      .from(permission)
      .orderBy(asc(permission.group), asc(permission.key));

    // Group by module
    const grouped = perms.reduce<Record<string, { id: string; key: string }[]>>(
      (acc, p) => {
        const g = p.group ?? "Other";
        if (!acc[g]) acc[g] = [];
        acc[g].push({ id: p.id, key: p.key });
        return acc;
      },
      {},
    );

    return NextResponse.json({ flat: perms, grouped }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/admin/permissions]", error);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}