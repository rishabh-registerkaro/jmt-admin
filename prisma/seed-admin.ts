// Creates the first dashboard login (role: superadmin) on a fresh database.
// Public signup is disabled, so without this nobody can log in to a new install.
// Never changes an existing account: if the email or username is taken, it stops.
//
//   npm run seed:admin -- --email you@example.com --username admin --password "a-strong-password"

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1]?.trim() : undefined;
}

async function main() {
  const email = arg("email")?.toLowerCase();
  const username = arg("username");
  const password = arg("password");

  if (!email || !username || !password) {
    throw new Error(
      'Usage: npm run seed:admin -- --email you@example.com --username admin --password "a-strong-password"',
    );
  }
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { username: true, email: true },
  });
  if (existing) {
    console.log(`• A user with that email or username already exists (${existing.username}) — nothing changed.`);
    return;
  }

  await prisma.user.create({
    data: { email, username, password: await bcrypt.hash(password, 10), role: "superadmin" },
  });
  console.log(`✓ Created superadmin "${username}" (${email}). Log in at /login.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
