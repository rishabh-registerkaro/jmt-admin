// Prints every index on every table so you can verify the database matches
// the Prisma schema. Indexes themselves are defined as @@index in
// prisma/schema.prisma and applied with `npx prisma db push`.
//
//   npx tsx prisma/show-indexes.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type IndexRow = {
  Table: string;
  Key_name: string;
  Column_name: string;
  Seq_in_index: number;
  Non_unique: number;
};

async function main() {
  const tables: { [k: string]: string }[] = await prisma.$queryRawUnsafe("SHOW TABLES");
  for (const t of tables) {
    const table = Object.values(t)[0] as string;
    if (table.startsWith("_")) continue; // prisma relation tables
    const rows = (await prisma.$queryRawUnsafe(
      `SHOW INDEX FROM \`${table}\``
    )) as IndexRow[];

    // Group multi-column indexes together
    const grouped = new Map<string, { cols: string[]; unique: boolean }>();
    for (const r of rows) {
      // MySQL returns numeric columns as BigInt — convert before arithmetic
      const entry = grouped.get(r.Key_name) ?? { cols: [], unique: Number(r.Non_unique) === 0 };
      entry.cols[Number(r.Seq_in_index) - 1] = r.Column_name;
      grouped.set(r.Key_name, entry);
    }

    console.log(`\n${table}`);
    for (const [name, { cols, unique }] of grouped) {
      const kind = name === "PRIMARY" ? "PRIMARY" : unique ? "UNIQUE " : "INDEX  ";
      console.log(`  ${kind} ${name} (${cols.join(", ")})`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
