import { db } from "@/lib/db/db";
import { systemLog } from "@/lib/db/schema";
import { NextRequest } from "next/server";

interface LogOptions {
  actorId?: string | null;
  actorType?: "system_user" | "user";
  action: string;
  entityType?: string;
  entityId?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
  req?: NextRequest;
}

/**
 * Write a system log entry. Always fire-and-forget — never awaited in the
 * request path so a logging failure can't break the actual operation.
 *
 * @example
 * logAction({ actorId: session.user.id, actorType: "system_user",
 *   action: "CREATE_TURF", entityType: "turf", entityId: created.id,
 *   description: `Created turf "${name}"`, req });
 */
export function logAction(opts: LogOptions): void {
  const ipAddress = opts.req
    ? (opts.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
       opts.req.headers.get("x-real-ip") ??
       "unknown")
    : null;

  const userAgent = opts.req
    ? opts.req.headers.get("user-agent")
    : null;

  db.insert(systemLog)
    .values({
      actorId: opts.actorId ?? null,
      actorType: opts.actorType ?? null,
      action: opts.action,
      entityType: opts.entityType ?? null,
      entityId: opts.entityId ?? null,
      description: opts.description ?? null,
      ipAddress,
      userAgent,
      metadata: opts.metadata ?? null,
    })
    .catch((err) => console.error("[logger] Failed to write system log:", err));
}