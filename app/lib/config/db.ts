import { PrismaClient } from "@prisma/client";

// Prisma client singleton — survives Next.js hot-reload in dev and keeps a
// small connection pool (configure via ?connection_limit= in DATABASE_URL,
// keep it low on Hostinger shared MySQL).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * @deprecated Mongoose-era connection helper. Prisma connects lazily on first
 * query — this is kept only so stale imports don't crash and does nothing.
 */
export const connectDB = async () => {};

export default prisma;
