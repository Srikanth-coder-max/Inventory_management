import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { acquireLock } from "@/lib/lock";
import {
  getIdempotentResponse,
  setIdempotentResponse,
} from "@/lib/idempotency";
import { isCreateReservationBody } from "@/types";
import { getReservationWithDetails } from "@/lib/reservations";

const RESERVATION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

type StockRow = {
  id: string;
  totalUnits: number;
  reservedUnits: number;
};

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 1. Parse & validate request body ──────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isCreateReservationBody(body)) {
    return NextResponse.json(
      {
        error:
          "Invalid request body. Required: productId (string), warehouseId (string), quantity (positive integer)",
      },
      { status: 400 }
    );
  }

  const { productId, warehouseId, quantity } = body;

  // ── 2. Idempotency check ───────────────────────────────────────────────────
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (idempotencyKey) {
    const cached = await getIdempotentResponse(idempotencyKey);
    if (cached) {
      return NextResponse.json(cached.body, { status: cached.status });
    }
  }

  // ── 3. Acquire Redis distributed lock for this stock row ──────────────────
  const lockKey = `stock:${productId}:${warehouseId}`;
  const releaseLock = await acquireLock(lockKey);

  if (!releaseLock) {
    return NextResponse.json(
      {
        error:
          "The system is currently processing another request for this item. Please try again in a moment.",
        code: "LOCK_CONTENTION",
      },
      { status: 503 }
    );
  }

  try {
    // ── 4. DB transaction with pessimistic row-level lock ──────────────────
    const reservation = await prisma.$transaction(async (tx) => {
      // SELECT ... FOR UPDATE on the exact Stock row.
      // Using tx.$queryRaw (not the global prisma instance) ensures the
      // lock executes within the correct transaction boundary.
      const rows = await tx.$queryRaw<StockRow[]>`
        SELECT id, "totalUnits", "reservedUnits"
        FROM stock
        WHERE "productId" = ${productId}
          AND "warehouseId" = ${warehouseId}
        FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new StockNotFoundError(
          "No stock record found for this product/warehouse combination"
        );
      }

      const stockRow = rows[0];
      const available = stockRow.totalUnits - stockRow.reservedUnits;

      if (available < quantity) {
        throw new InsufficientStockError(
          `Insufficient stock. Requested: ${quantity}, Available: ${available}`
        );
      }

      // Atomically increment reservedUnits
      await tx.stock.update({
        where: { id: stockRow.id },
        data: { reservedUnits: { increment: quantity } },
      });

      // Create the reservation record
      const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MS);
      const created = await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          userId: session.user.id,
          quantity,
          status: "PENDING",
          expiresAt,
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
        include: {
          product: true,
          warehouse: true,
          user: true,
        },
      });

      return created;
    });

    const responseBody = {
      data: await getReservationWithDetails(reservation.id),
    };

    // ── 5. Cache idempotent response ─────────────────────────────────────────
    if (idempotencyKey) {
      await setIdempotentResponse(idempotencyKey, 201, responseBody);
    }

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      const errBody = { error: error.message, code: "INSUFFICIENT_STOCK" };
      if (idempotencyKey) {
        await setIdempotentResponse(idempotencyKey, 409, errBody);
      }
      return NextResponse.json(errBody, { status: 409 });
    }

    if (error instanceof StockNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("[POST /api/reservations]", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the reservation" },
      { status: 500 }
    );
  } finally {
    // Always release the Redis lock
    await releaseLock();
  }
}

// ── Custom error classes for clean control flow ──────────────────────────────

class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

class StockNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockNotFoundError";
  }
}
