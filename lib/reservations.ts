import { prisma } from "@/lib/prisma";
import type { ReservationWithDetails } from "@/types";

type ReservationRecord = {
  id: string;
  productId: string;
  warehouseId: string;
  userId: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: Date;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    description: string;
    price: { toString(): string };
    imageUrl: string | null;
    sku: string;
    createdAt: Date;
    updatedAt: Date;
  };
  warehouse: {
    id: string;
    name: string;
    location: string;
    createdAt: Date;
    updatedAt: Date;
  };
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

function serializeReservation(reservation: ReservationRecord): ReservationWithDetails {
  return {
    ...reservation,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    expiresAt: reservation.expiresAt.toISOString(),
    product: {
      ...reservation.product,
      createdAt: reservation.product.createdAt.toISOString(),
      updatedAt: reservation.product.updatedAt.toISOString(),
      price: reservation.product.price.toString(),
    },
    warehouse: {
      ...reservation.warehouse,
      createdAt: reservation.warehouse.createdAt.toISOString(),
      updatedAt: reservation.warehouse.updatedAt.toISOString(),
    },
    user: {
      ...reservation.user,
      createdAt: reservation.user.createdAt.toISOString(),
      updatedAt: reservation.user.updatedAt.toISOString(),
    },
  };
}

export async function getReservationWithDetails(id: string): Promise<ReservationWithDetails | null> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      product: true,
      warehouse: true,
      user: true,
    },
  });

  if (!reservation) return null;

  return serializeReservation(reservation as ReservationRecord);
}

export async function getUserReservationsWithDetails(userId: string): Promise<ReservationWithDetails[]> {
  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: {
      product: true,
      warehouse: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return reservations.map((reservation) => serializeReservation(reservation as ReservationRecord));
}