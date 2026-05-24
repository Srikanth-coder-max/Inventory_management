import { prisma } from "./prisma";

type ExpiredReservation = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
};

type StockGroupEntry = {
  productId: string;
  warehouseId: string;
  quantity: number;
};

/**
 * Lazy cleanup: finds all PENDING reservations that have passed their expiresAt
 * timestamp, releases their reservedUnits, and marks them RELEASED.
 *
 * Called as a side-effect before reads so that stale reservations are cleaned
 * up on demand — no dedicated background worker required for correctness.
 *
 * Also powers the /api/cron/cleanup endpoint for Vercel Cron Jobs.
 */
export async function runLazyCleanup(): Promise<number> {
  const now = new Date();

  // Find all expired PENDING reservations
  const expired: ExpiredReservation[] = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    select: {
      id: true,
      productId: true,
      warehouseId: true,
      quantity: true,
    },
  });

  if (expired.length === 0) return 0;

  // Batch release in a single transaction
  await prisma.$transaction(async (tx) => {
    // Mark all expired reservations as RELEASED
    await tx.reservation.updateMany({
      where: {
        id: { in: expired.map((r: ExpiredReservation) => r.id) },
        status: "PENDING", // guard against concurrent cleanup
      },
      data: { status: "RELEASED" },
    });

    // Decrement reservedUnits per (product, warehouse) pair
    const grouped = expired.reduce<Record<string, StockGroupEntry>>(
      (acc: Record<string, StockGroupEntry>, r: ExpiredReservation) => {
        const key = `${r.productId}:${r.warehouseId}`;
        if (!acc[key]) {
          acc[key] = { productId: r.productId, warehouseId: r.warehouseId, quantity: 0 };
        }
        acc[key].quantity += r.quantity;
        return acc;
      },
      {}
    );

    for (const entry of Object.values(grouped)) {
      const { productId, warehouseId, quantity } = entry;
      await tx.stock.updateMany({
        where: { productId, warehouseId },
        data: { reservedUnits: { decrement: quantity } },
      });
    }
  });

  return expired.length;
}
