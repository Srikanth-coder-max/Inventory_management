import { defineConfig } from "prisma/config";
import "dotenv/config";

/**
 * Prisma v7 configuration file.
 * Database connection URLs are specified here instead of in schema.prisma.
 *
 * For Supabase / Neon:
 *   - DATABASE_URL: use the pooler URL (port 6543) for runtime queries
 *   - DIRECT_URL: use the direct connection URL (port 5432) for migrations
 *
 * For local PostgreSQL: both can be the same connection string.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL is preferred for migrations (bypasses PgBouncer).
    // Falls back to DATABASE_URL if DIRECT_URL is not set.
    // Using process.env directly (not the env() helper) so generate works without a .env file.
    url: process.env.DIRECT_URL?.trim() ?? process.env.DATABASE_URL?.trim() ?? "",
  },
});
