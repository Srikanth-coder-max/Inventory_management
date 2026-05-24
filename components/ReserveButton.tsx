"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { ReservationWithDetails } from "@/types";

interface ReserveButtonProps {
  productId: string;
  warehouseId: string;
  productName: string;
  warehouseName: string;
  quantity?: number;
  onSuccess: (reservationId: string) => void;
}

export function ReserveButton({
  productId,
  warehouseId,
  productName,
  warehouseName,
  quantity = 1,
  onSuccess,
}: ReserveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReserve = async () => {
    setIsLoading(true);

    // Generate a unique idempotency key for this reserve attempt
    const idempotencyKey = `reserve-${productId}-${warehouseId}-${Date.now()}`;

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ productId, warehouseId, quantity }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push(`/auth?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (response.status === 409) {
        toast(
          `⚠ Out of stock at ${warehouseName}. The last unit was just reserved by another customer.`,
          "error"
        );
        return;
      }

      if (response.status === 503) {
        toast(
          "High demand detected. Please try again in a moment.",
          "warning"
        );
        return;
      }

      if (!response.ok) {
        toast(
          data.error ?? "Failed to reserve item. Please try again.",
          "error"
        );
        return;
      }

      const reservation: ReservationWithDetails = data.data;
      toast(
        `✓ "${productName}" reserved at ${warehouseName}! You have 10 minutes to checkout.`,
        "success"
      );
      onSuccess(reservation.id);
    } catch {
      toast("Network error. Please check your connection and try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="md"
      isLoading={isLoading}
      onClick={handleReserve}
      className="w-full"
      id={`reserve-${productId}-${warehouseId}`}
      aria-label={`Reserve ${productName} at ${warehouseName}`}
    >
      {isLoading ? "Reserving..." : "Reserve — 10 min hold"}
    </Button>
  );
}
