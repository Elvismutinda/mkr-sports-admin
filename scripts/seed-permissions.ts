/**
 * Seed script: permissions + system roles
 *
 * Run with:  npx tsx scripts/seed-permissions.ts
 * (or add to your existing seed pipeline)
 */

import { db } from "@/lib/db/db";
import { permission, systemRole, rolePermission } from "@/lib/db/schema";
import {
  Permission,
  PERMISSION_GROUPS,
  SYSTEM_ROLES,
} from "@/_utils/enums/permissions.enum";
import { eq, inArray } from "drizzle-orm";

async function seedPermissions() {
  console.log("⏳ Seeding permissions...");

  const allPerms = Object.values(Permission).map((key) => ({
    key,
    group: PERMISSION_GROUPS[key] ?? null,
    description: null,
  }));

  // Upsert — insert new, skip existing (idempotent)
  for (const p of allPerms) {
    const existing = await db
      .select({ id: permission.id })
      .from(permission)
      .where(eq(permission.key, p.key))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(permission).values(p);
      console.log(`  ✅ Inserted permission: ${p.key}`);
    }
  }

  console.log("✅ Permissions seeded.\n");
}

async function seedRoles() {
  console.log("⏳ Seeding system roles...");

  // Fetch all permission rows so we can look up IDs by key
  const allPermRows = await db
    .select({ id: permission.id, key: permission.key })
    .from(permission);

  const permMap = Object.fromEntries(allPermRows.map((p) => [p.key, p.id]));

  for (const [roleName, config] of Object.entries(SYSTEM_ROLES)) {
    // Upsert role
    let roleId: string;
    const existing = await db
      .select({ id: systemRole.id })
      .from(systemRole)
      .where(eq(systemRole.name, roleName))
      .limit(1);

    if (existing.length > 0) {
      roleId = existing[0].id;
      // Update description / isDefault in case config changed
      await db
        .update(systemRole)
        .set({
          description: config.description,
          isDefault: config.isDefault,
        })
        .where(eq(systemRole.id, roleId));
      console.log(`  ♻️  Updated role: ${roleName}`);
    } else {
      const [inserted] = await db
        .insert(systemRole)
        .values({
          name: roleName,
          description: config.description,
          isDefault: config.isDefault,
        })
        .returning({ id: systemRole.id });
      roleId = inserted.id;
      console.log(`  ✅ Inserted role: ${roleName}`);
    }

    // Sync role ↔ permission assignments
    // 1. Remove any permissions no longer in config
    const desiredPermIds = config.permissions
      .map((k) => permMap[k])
      .filter(Boolean);

    const currentAssignments = await db
      .select({ permissionId: rolePermission.permissionId })
      .from(rolePermission)
      .where(eq(rolePermission.roleId, roleId));

    const currentIds = currentAssignments.map((r) => r.permissionId);
    const toRemove = currentIds.filter((id) => !desiredPermIds.includes(id));
    const toAdd = desiredPermIds.filter((id) => !currentIds.includes(id));

    if (toRemove.length > 0) {
      await db
        .delete(rolePermission)
        .where(
          inArray(rolePermission.permissionId, toRemove),
        );
    }

    for (const permId of toAdd) {
      await db
        .insert(rolePermission)
        .values({ roleId, permissionId: permId })
        .onConflictDoNothing();
    }

    if (toAdd.length > 0 || toRemove.length > 0) {
      console.log(
        `     → +${toAdd.length} permissions, -${toRemove.length} permissions`,
      );
    }
  }

  console.log("✅ System roles seeded.\n");
}

async function main() {
  try {
    await seedPermissions();
    await seedRoles();
    console.log("🎉 Seed complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

main();