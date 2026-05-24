import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getIdempotentResponse,
  setIdempotentResponse,
} from "@/lib/idempotency";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type ReservationLockRow = {
  id: string;
  userId: string;
  status: string;
  expiresAt: Date;
  quantity: number;
  productId: string;
  warehouseId: string;
};

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Idempotency check ──────────────────────────────────────────────────────
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (idempotencyKey) {
    const cached = await getIdempotentResponse(`confirm:${idempotencyKey}`);
    if (cached) {
      return NextResponse.json(cached.body, { status: cached.status });
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock the reservation row to prevent concurrent confirms
      const reservations = await tx.$queryRaw<ReservationLockRow[]>`
        SELECT id, "userId", status, "expiresAt", quantity, "productId", "warehouseId"
        FROM reservations
        WHERE id = ${id}
        FOR UPDATE
      `;

      if (reservations.length === 0) {
        throw new ReservationNotFoundError("Reservation not found");
      }

      const reservation = reservations[0];

      if (reservation.userId !== session.user.id) {
        throw new ReservationOwnershipError("Forbidden");
      }

      if (reservation.status === "CONFIRMED") {
        throw new AlreadyProcessedError("Reservation is already confirmed");
      }

      if (
        reservation.status === "RELEASED" ||
        reservation.expiresAt < new Date()
      ) {
        throw new ReservationExpiredError(
          "Reservation has expired or been released"
        );
      }

      // Transition: PENDING → CONFIRMED
      // Permanently decrement totalUnits AND reservedUnits
      const updated = await tx.reservation.update({
        where: { id },
        data: { status: "CONFIRMED" },
        include: { product: true, warehouse: true },
      });

      await tx.stock.updateMany({
        where: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
        },
        data: {
          totalUnits: { decrement: reservation.quantity },
          reservedUnits: { decrement: reservation.quantity },
        },
      });

      return updated;
    });

    const responseBody = {
      data: {
        ...result,
        product: {
          ...result.product,
          price: result.product.price.toString(),
        },
      },
    };

    if (idempotencyKey) {
      await setIdempotentResponse(`confirm:${idempotencyKey}`, 200, responseBody);
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ReservationExpiredError) {
      const body = { error: error.message, code: "RESERVATION_EXPIRED" };
      if (idempotencyKey) {
        await setIdempotentResponse(`confirm:${idempotencyKey}`, 410, body);
      }
      return NextResponse.json(body, { status: 410 });
    }

    if (error instanceof AlreadyProcessedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof ReservationOwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error(`[POST /api/reservations/${id}/confirm]`, error);
    return NextResponse.json(
      { error: "Failed to confirm reservation" },
      { status: 500 }
    );
  }
}

class ReservationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationNotFoundError";
  }
}

class ReservationExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationExpiredError";
  }
}

class AlreadyProcessedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlreadyProcessedError";
  }
}

class ReservationOwnershipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationOwnershipError";
  }
}
