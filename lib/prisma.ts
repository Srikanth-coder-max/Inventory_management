import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function createPrismaClient() {
  let connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    console.warn(
      "⚠️ DATABASE_URL environment variable is not set. " +
        "Using a dummy connection string for build purposes. " +
        "Please set this variable before running the app."
    );
    connectionString = "postgres://dummy:dummy@localhost:5432/dummy";
  }

  const pool = new Pool({
    connectionString,
    // Limit connections in serverless environments
    max: process.env.NODE_ENV === "production" ? 5 : 10,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
