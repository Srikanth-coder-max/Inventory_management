"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ReservationWithDetails } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge, getReservationBadgeVariant } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";

interface CheckoutClientProps {
  reservation: ReservationWithDetails;
}

type UIState = "pending" | "expired" | "confirmed" | "released" | "confirming" | "releasing";

function formatTimeRemaining(ms: number): { minutes: string; seconds: string; isUrgent: boolean } {
  if (ms <= 0) return { minutes: "00", seconds: "00", isUrgent: true };
  const totalSecs = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSecs / 60);
  const seconds = totalSecs % 60;
  return {
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    isUrgent: ms < 2 * 60 * 1000, // last 2 minutes
  };
}

export function CheckoutClient({ reservation }: CheckoutClientProps) {
  const router = useRouter();
  const expiresAt = new Date(reservation.expiresAt).getTime();

  const [uiState, setUiState] = useState<UIState>(() => {
    if (reservation.status === "CONFIRMED") return "confirmed";
    if (reservation.status === "RELEASED") return "released";
    if (Date.now() >= expiresAt) return "expired";
    return "pending";
  });

  const [timeRemaining, setTimeRemaining] = useState(
    Math.max(0, expiresAt - Date.now())
  );

  // Countdown timer
  useEffect(() => {
    if (uiState !== "pending") return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setUiState("expired");
        toast("Your reservation has expired. The item has been returned to stock.", "warning");
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [uiState, expiresAt]);

  const handleConfirm = useCallback(async () => {
    if (uiState !== "pending") return;
    setUiState("confirming");

    const idempotencyKey = `confirm-${reservation.id}-${Date.now()}`;

    try {
      const res = await fetch(`/api/reservations/${reservation.id}/confirm`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push(`/auth?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (res.status === 410) {
        setUiState("expired");
        toast("Reservation expired. The item has been returned to stock.", "error");
        return;
      }

      if (res.status === 409) {
        toast(data.error ?? "This reservation is no longer valid.", "error");
        setUiState(reservation.status === "CONFIRMED" ? "confirmed" : "released");
        return;
      }

      if (!res.ok) {
        toast(data.error ?? "Failed to confirm. Please try again.", "error");
        setUiState("pending");
        return;
      }

      setUiState("confirmed");
      toast("🎉 Purchase confirmed! Your order is being processed.", "success");
    } catch {
      toast("Network error. Please try again.", "error");
      setUiState("pending");
    }
  }, [uiState, reservation.id, reservation.status, router]);

  const handleRelease = useCallback(async () => {
    if (uiState !== "pending") return;
    setUiState("releasing");

    try {
      const res = await fetch(`/api/reservations/${reservation.id}/release`, {
        method: "POST",
      });

      if (res.status === 401) {
        router.push(`/auth?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        toast(data.error ?? "Failed to cancel reservation.", "error");
        setUiState("pending");
        return;
      }

      setUiState("released");
      toast("Reservation cancelled. Stock returned.", "info");
      setTimeout(() => router.push("/"), 1500);
    } catch {
      toast("Network error. Please try again.", "error");
      setUiState("pending");
    }
  }, [uiState, reservation.id, router]);

  const { minutes, seconds, isUrgent } = formatTimeRemaining(timeRemaining);

  const isActionDisabled =
    uiState === "confirming" ||
    uiState === "releasing" ||
    uiState === "confirmed" ||
    uiState === "released" ||
    uiState === "expired";

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[hsl(220,12%,48%)] mb-8">
        <a href="/" className="hover:text-white transition-colors">Products</a>
        <span>/</span>
        <span className="text-white">Checkout</span>
      </nav>

      {/* Main card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Top bar */}
        <div className={`h-1.5 ${uiState === "confirmed" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : uiState === "expired" || uiState === "released" ? "bg-gradient-to-r from-zinc-600 to-zinc-700" : "bg-gradient-to-r from-brand-500 via-blue-500 to-cyan-500"}`} />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {uiState === "confirmed"
                  ? "Order Confirmed!"
                  : uiState === "expired"
                  ? "Reservation Expired"
                  : uiState === "released"
                  ? "Reservation Cancelled"
                  : "Complete Your Purchase"}
              </h1>
              <p className="text-sm text-[hsl(220,12%,52%)] font-mono">
                #{reservation.id.slice(0, 12).toUpperCase()}
              </p>
            </div>
            <Badge variant={getReservationBadgeVariant(
              uiState === "confirmed" ? "CONFIRMED"
              : uiState === "released" ? "RELEASED"
              : uiState === "expired" ? "RELEASED"
              : "PENDING"
            )} />
          </div>

          {/* ── Expired alert ─────────────────────────────────────────────── */}
          {uiState === "expired" && (
            <div
              className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25 animate-slide-up"
              role="alert"
              aria-live="assertive"
            >
              <span className="text-red-400 text-xl shrink-0 mt-0.5">⏱</span>
              <div>
                <p className="text-red-300 font-semibold">Reservation Expired</p>
                <p className="text-sm text-red-400/70 mt-0.5">
                  Your 10-minute hold has ended and the item has been returned to stock.
                </p>
              </div>
            </div>
          )}

          {/* ── Confirmed success ──────────────────────────────────────────── */}
          {uiState === "confirmed" && (
            <div
              className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 animate-slide-up"
              role="status"
            >
              <span className="text-emerald-400 text-xl shrink-0 mt-0.5">✓</span>
              <div>
                <p className="text-emerald-300 font-semibold">Purchase Successful</p>
                <p className="text-sm text-emerald-400/70 mt-0.5">
                  Your order has been confirmed and is being processed.
                </p>
              </div>
            </div>
          )}

          {/* ── Released info ──────────────────────────────────────────────── */}
          {uiState === "released" && (
            <div
              className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-zinc-500/10 border border-zinc-500/25 animate-slide-up"
              role="status"
            >
              <span className="text-zinc-400 text-xl shrink-0 mt-0.5">↩</span>
              <div>
                <p className="text-zinc-300 font-semibold">Reservation Cancelled</p>
                <p className="text-sm text-zinc-400/70 mt-0.5">
                  Stock has been returned. Redirecting to products...
                </p>
              </div>
            </div>
          )}

          {/* ── Product details ────────────────────────────────────────────── */}
          <div className="bg-white/4 rounded-xl p-5 mb-6">
            <h2 className="text-xs font-semibold text-[hsl(220,12%,48%)] uppercase tracking-widest mb-4">
              Order Summary
            </h2>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white">{reservation.product.name}</p>
                  <p className="text-sm text-[hsl(220,12%,52%)] mt-0.5">
                    {reservation.product.description.slice(0, 80)}...
                  </p>
                </div>
                <span className="text-lg font-bold text-white ml-4 shrink-0">
                  ${(Number(reservation.product.price) * reservation.quantity).toFixed(2)}
                </span>
              </div>

              <div className="border-t border-white/8 pt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[hsl(220,12%,48%)]">Warehouse</p>
                  <p className="text-white font-medium mt-0.5">
                    {reservation.warehouse.name}
                  </p>
                  <p className="text-[hsl(220,12%,48%)] text-xs">
                    {reservation.warehouse.location}
                  </p>
                </div>
                <div>
                  <p className="text-[hsl(220,12%,48%)]">Quantity</p>
                  <p className="text-white font-medium mt-0.5">
                    {reservation.quantity} unit{reservation.quantity !== 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[hsl(220,12%,48%)]">Unit Price</p>
                  <p className="text-white font-medium mt-0.5">
                    ${Number(reservation.product.price).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[hsl(220,12%,48%)]">SKU</p>
                  <p className="text-white font-mono text-xs mt-0.5">
                    {reservation.product.sku}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Countdown Timer ────────────────────────────────────────────── */}
          {uiState === "pending" && (
            <div
              className={`mb-6 rounded-xl border p-5 transition-all duration-500 ${
                isUrgent
                  ? "bg-red-500/8 border-red-500/25 glow-danger"
                  : "bg-amber-500/5 border-amber-500/15"
              }`}
              aria-live="polite"
              aria-label={`Time remaining: ${minutes} minutes and ${seconds} seconds`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${isUrgent ? "text-red-400" : "text-amber-400"}`}>
                    {isUrgent ? "⚠ Expiring Soon!" : "Reservation Expires In"}
                  </p>
                  <p className={`text-[hsl(220,12%,52%)] text-xs`}>
                    Expires {new Date(reservation.expiresAt).toLocaleTimeString()}
                  </p>
                </div>

                {/* Digital clock */}
                <div className={`flex items-center gap-1 font-mono font-bold ${isUrgent ? "text-red-300 animate-countdown" : "text-white"}`}>
                  <div className="bg-white/8 rounded-lg px-3 py-2 text-2xl min-w-[3rem] text-center">
                    {minutes}
                  </div>
                  <span className={`text-xl ${isUrgent ? "animate-pulse" : ""}`}>:</span>
                  <div className="bg-white/8 rounded-lg px-3 py-2 text-2xl min-w-[3rem] text-center">
                    {seconds}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-1 rounded-full bg-white/8 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? "bg-red-500" : "bg-amber-500"}`}
                  style={{
                    width: `${Math.max(0, (timeRemaining / (10 * 60 * 1000)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Action buttons ─────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            {uiState === "expired" || uiState === "released" ? (
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => router.push("/")}
              >
                ← Browse Products
              </Button>
            ) : uiState === "confirmed" ? (
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => router.push("/")}
              >
                ← Continue Shopping
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={uiState === "confirming"}
                  disabled={isActionDisabled}
                  onClick={handleConfirm}
                  className="flex-1 glow-brand"
                  id="confirm-purchase-btn"
                  aria-label="Confirm purchase"
                >
                  {uiState === "confirming" ? "Processing..." : "Confirm Purchase"}
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  isLoading={uiState === "releasing"}
                  disabled={isActionDisabled}
                  onClick={handleRelease}
                  className="sm:w-auto"
                  id="cancel-reservation-btn"
                  aria-label="Cancel reservation"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>

          {/* Security note */}
          {(uiState === "pending" || uiState === "confirming") && (
            <p className="text-center text-xs text-[hsl(220,12%,36%)] mt-4">
              🔒 Stock is guaranteed during your reservation window
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
