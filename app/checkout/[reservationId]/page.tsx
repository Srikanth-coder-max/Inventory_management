export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { CheckoutClient } from "@/components/CheckoutClient";
import type { Metadata } from "next";
import { getReservationWithDetails } from "@/lib/reservations";

interface PageProps {
  params: Promise<{ reservationId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { reservationId } = await params;
  return {
    title: `Checkout — Reservation #${reservationId.slice(0, 8).toUpperCase()} | StockFlow`,
    description: "Complete your purchase before the reservation expires.",
  };
}

export default async function CheckoutPage({ params }: PageProps) {
  const { reservationId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/auth?callbackUrl=${encodeURIComponent(`/checkout/${reservationId}`)}`);
  }

  const reservation = await getReservationWithDetails(reservationId);

  if (!reservation) {
    notFound();
  }

  if (reservation.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <CheckoutClient reservation={reservation} />
    </div>
  );
}
