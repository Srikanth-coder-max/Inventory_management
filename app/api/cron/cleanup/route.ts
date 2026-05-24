import { NextRequest, NextResponse } from "next/server";
import { runLazyCleanup } from "@/lib/cleanup";

/**
 * POST /api/cron/cleanup
 *
 * Designed for Vercel Cron Jobs (every 5 minutes).
 * Protected by CRON_SECRET environment variable.
 *
 * Finds all PENDING reservations where expiresAt < NOW(),
 * reverts their reservedUnits, and sets status to RELEASED.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const releasedCount = await runLazyCleanup();

    return NextResponse.json({
      data: {
        releasedCount,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[GET /api/cron/cleanup]", error);
    return NextResponse.json(
      { error: "Cleanup job failed" },
      { status: 500 }
    );
  }
}
