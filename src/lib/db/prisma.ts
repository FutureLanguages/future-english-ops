import { PrismaClient } from "@prisma/client";
import { getDatabaseHostPort, sanitizeDatabaseUrl } from "@/lib/db/runtime-database-url";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: ["warn", "error"],
  });

  console.info(
    `[prisma] client created target=DATABASE_URL reason=runtime-env host=${getDatabaseHostPort(process.env.DATABASE_URL)} db=${sanitizeDatabaseUrl(process.env.DATABASE_URL)}`,
  );
}

export const prisma = globalForPrisma.prisma;
