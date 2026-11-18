// Creates the built-in dashboard roles and links every existing user to one.
// Safe to run any number of times.
//
//   npm run seed:roles
//
// - Upserts Super Admin, Admin, Editor and Leads Manager (by key). Existing
//   roles keep any permission edits made in the Roles screen; only a missing
//   role is created with its default permissions.
// - Users without a roleId get the role matching their legacy `role` column:
//   superadmin → Super Admin, admin → Admin, editor/contributor → Editor.
//   Contributors' legacy column is set to "editor" (contributor is retired).
//
// Run `npx prisma db push` first (adds jmt_admin_roles and users.roleId).

import { PrismaClient } from "@prisma/client";
import { SYSTEM_ROLES, legacyRoleToSystemKey } from "../app/lib/constants/permissions";

const prisma = new PrismaClient();

export async function seedRoles(client: PrismaClient = prisma) {
  const ids = new Map<string, string>();
  for (const def of SYSTEM_ROLES) {
    const role = await client.adminRole.upsert({
      where: { key: def.key },
      create: {
        key: def.key,
        name: def.name,
        description: def.description,
        permissions: [...def.permissions],
        isSystem: true,
      },
      // Super Admin is always reset to everything; others keep edits.
      update: def.key === "superadmin" ? { permissions: [...def.permissions], isSystem: true } : { isSystem: true },
    });
    ids.set(def.key, role.id);
  }

  let linked = 0;
  for (const legacy of ["superadmin", "admin", "editor", "contributor"] as const) {
    const roleId = ids.get(legacyRoleToSystemKey(legacy))!;
    const res = await client.user.updateMany({
      where: { roleId: null, role: legacy },
      data: legacy === "contributor" ? { roleId, role: "editor" } : { roleId },
    });
    linked += res.count;
  }
  return { roles: ids.size, linked, ids };
}

// Run directly (not when imported by seed-admin).
if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed-roles.ts")) {
  seedRoles()
    .then(({ roles, linked }) => console.log(`✓ ${roles} built-in roles ready; ${linked} user(s) linked to a role.`))
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
