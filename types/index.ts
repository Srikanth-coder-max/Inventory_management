// ─────────────────────────────────────────────
// Domain entity interfaces
// ─────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string; // Decimal serialized as string
  imageUrl: string | null;
  sku: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stock {
  id: string;
  productId: string;
  warehouseId: string;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number; // computed: totalUnits - reservedUnits
}

export type ReservationStatus = "PENDING" | "CONFIRMED" | "RELEASED";

export interface Reservation {
  id: string;
  productId: string;
  warehouseId: string;
  userId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string;
  idempotencyKey: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Enriched/joined interfaces used in API responses
// ─────────────────────────────────────────────

export interface StockWithWarehouse extends Stock {
  warehouse: Warehouse;
}

export interface ProductWithStock extends Product {
  stock: StockWithWarehouse[];
}

export interface ReservationWithDetails extends Reservation {
  product: Product;
  warehouse: Warehouse;
  user: User;
}

// ─────────────────────────────────────────────
// API request body interfaces
// ─────────────────────────────────────────────

export interface CreateReservationBody {
  productId: string;
  warehouseId: string;
  quantity: number;
}

// ─────────────────────────────────────────────
// Lightweight runtime type guards (no Zod)
// ─────────────────────────────────────────────

export function isCreateReservationBody(
  body: unknown
): body is CreateReservationBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.productId === "string" &&
    b.productId.trim().length > 0 &&
    typeof b.warehouseId === "string" &&
    b.warehouseId.trim().length > 0 &&
    typeof b.quantity === "number" &&
    Number.isInteger(b.quantity) &&
    b.quantity > 0
  );
}

// ─────────────────────────────────────────────
// API response envelope
// ─────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
}

export interface ApiSuccess<T> {
  data: T;
}
