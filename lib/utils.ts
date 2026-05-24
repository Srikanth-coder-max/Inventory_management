import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for merging Tailwind CSS classes with conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a price number to a USD currency string.
 */
export function formatPrice(price: string | number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(price));
}

/**
 * Returns the difference between a future date and now, clamped to 0.
 */
export function getTimeRemaining(expiresAt: string | Date): number {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

/**
 * Checks if a reservation has expired.
 */
export function isExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}
