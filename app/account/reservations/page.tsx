import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserReservationsWithDetails } from "@/lib/reservations";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth?callbackUrl=/account/reservations");
  }

  const reservations = await getUserReservationsWithDetails(session.user.id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-4">
          My Account
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Your Reservations
        </h1>
        <p className="mt-3 text-[hsl(220,12%,58%)] max-w-2xl">
          Every hold and order tied to your account lives here. Check status,
          revisit checkout, or review what has already been confirmed.
        </p>
      </div>

      <div className="glass-card rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl shadow-black/30">
        <div className="border-b border-white/10 bg-white/5 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[hsl(220,12%,48%)]">
              Signed in as
            </p>
            <p className="text-sm text-white font-medium mt-1">
              {session.user.name ?? session.user.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-[hsl(220,12%,48%)]">
              Total
            </p>
            <p className="text-sm text-white font-medium mt-1">
              {reservations.length} reservation{reservations.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {reservations.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/6 border border-white/10 text-2xl">
              📦
            </div>
            <h2 className="text-xl font-semibold text-white">No reservations yet</h2>
            <p className="mt-2 text-sm text-[hsl(220,12%,56%)]">
              Reserve stock from the homepage and it will appear here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:from-brand-400 hover:to-cyan-400"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/8">
            {reservations.map((reservation) => {
              const isActive = reservation.status === "PENDING";
              const statusLabel =
                reservation.status === "PENDING"
                  ? "Pending"
                  : reservation.status === "CONFIRMED"
                  ? "Confirmed"
                  : "Released";

              return (
                <div key={reservation.id} className="px-6 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-white">
                        {reservation.product.name}
                      </h2>
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                          isActive
                            ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                            : reservation.status === "CONFIRMED"
                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                            : "border-zinc-500/25 bg-zinc-500/10 text-zinc-300"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[hsl(220,12%,58%)] line-clamp-2">
                      {reservation.product.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[hsl(220,12%,54%)]">
                      <span>
                        Warehouse: <span className="text-white">{reservation.warehouse.name}</span>
                      </span>
                      <span>
                        Qty: <span className="text-white">{reservation.quantity}</span>
                      </span>
                      <span>
                        Total: <span className="text-white">${(Number(reservation.product.price) * reservation.quantity).toFixed(2)}</span>
                      </span>
                      <span>
                        Expires: <span className="text-white">{new Date(reservation.expiresAt).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
                    <Link
                      href={`/checkout/${reservation.id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:from-brand-400 hover:to-cyan-400"
                    >
                      Open checkout
                    </Link>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[hsl(220,12%,58%)]">
                      #{reservation.id.slice(0, 10).toUpperCase()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}