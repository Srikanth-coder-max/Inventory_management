"use client";

import { HTMLAttributes } from "react";
import { clsx } from "clsx";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "available" | "low" | "out" | "pending" | "confirmed" | "released";
}

const variantMap = {
  available: "badge-available",
  low: "badge-low",
  out: "badge-out",
  pending: "badge-pending",
  confirmed: "badge-confirmed",
  released: "badge-released",
};

const labelMap = {
  available: "In Stock",
  low: "Low Stock",
  out: "Out of Stock",
  pending: "Pending",
  confirmed: "Confirmed",
  released: "Released",
};

export function Badge({
  variant = "available",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide",
        variantMap[variant],
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children ?? labelMap[variant]}
    </span>
  );
}

export function getStockBadgeVariant(
  available: number
): "available" | "low" | "out" {
  if (available === 0) return "out";
  if (available <= 5) return "low";
  return "available";
}

export function getReservationBadgeVariant(
  status: string
): "pending" | "confirmed" | "released" {
  if (status === "CONFIRMED") return "confirmed";
  if (status === "RELEASED") return "released";
  return "pending";
}
