import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type ReservationLockRow = {
  id: string;
  userId: string;
  status: string;
  quantity: number;
  productId: string;
  warehouseId: string;
};

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock the reservation row
      const reservations = await tx.$queryRaw<ReservationLockRow[]>`
        SELECT id, "userId", status, quantity, "productId", "warehouseId"
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

      if (reservation.status !== "PENDING") {
        throw new InvalidStatusError(
          `Cannot release a reservation with status: ${reservation.status}`
        );
      }

      // Transition: PENDING → RELEASED + decrement reservedUnits
      const updated = await tx.reservation.update({
        where: { id },
        data: { status: "RELEASED" },
        include: { product: true, warehouse: true },
      });

      await tx.stock.updateMany({
        where: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
        },
        data: {
          reservedUnits: { decrement: reservation.quantity },
        },
      });

      return updated;
    });

    return NextResponse.json({
      data: {
        ...result,
        product: {
          ...result.product,
          price: result.product.price.toString(),
        },
      },
    });
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof InvalidStatusError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof ReservationOwnershipError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error(`[POST /api/reservations/${id}/release]`, error);
    return NextResponse.json(
      { error: "Failed to release reservation" },
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

class InvalidStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStatusError";
  }
}

class ReservationOwnershipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationOwnershipError";
  }
}
