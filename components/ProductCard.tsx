"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductWithStock, StockWithWarehouse } from "@/types";
import { Badge, getStockBadgeVariant } from "@/components/ui/badge";
import { ReserveButton } from "@/components/ReserveButton";

interface ProductCardProps {
  product: ProductWithStock;
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedStock, setSelectedStock] = useState<StockWithWarehouse | null>(
    product.stock.length > 0 ? product.stock[0] : null
  );
  const router = useRouter();

  const totalAvailable = product.stock.reduce(
    (sum, s) => sum + s.availableUnits,
    0
  );

  const handleReserveSuccess = (reservationId: string) => {
    router.push(`/checkout/${reservationId}`);
  };

  return (
    <article className="glass-card rounded-2xl overflow-hidden hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 group flex flex-col h-full">
      {/* Product header gradient band */}
      <div className="h-2 bg-gradient-to-r from-brand-500 via-blue-500 to-cyan-500" />

      <div className="p-6 flex flex-col gap-5 flex-1">
        {/* Product info */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-base font-semibold text-white leading-snug group-hover:text-brand-300 transition-colors duration-200">
              {product.name}
            </h2>
            <span className="shrink-0 text-lg font-bold text-white">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-[hsl(220,12%,52%)] leading-relaxed line-clamp-2">
            {product.description}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-mono text-[hsl(220,12%,42%)]">
              SKU: {product.sku}
            </span>
            <span className="text-[hsl(220,12%,30%)]">·</span>
            <Badge variant={getStockBadgeVariant(totalAvailable)}>
              {totalAvailable === 0
                ? "Out of Stock"
                : totalAvailable <= 10
                ? `Only ${totalAvailable} left`
                : `${totalAvailable} available`}
            </Badge>
          </div>
        </div>

        {/* Warehouse selector */}
        {product.stock.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-[hsl(220,12%,48%)] uppercase tracking-widest mb-2">
              Select Warehouse
            </p>
            <div className="flex flex-col gap-2">
              {product.stock.map((s) => {
                const isSelected = selectedStock?.id === s.id;
                const available = s.availableUnits;
                const badgeVariant = getStockBadgeVariant(available);

                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStock(s)}
                    disabled={available === 0}
                    className={`
                      flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all duration-200
                      ${
                        isSelected
                          ? "border-brand-500/50 bg-brand-500/10 shadow-sm shadow-brand-500/10"
                          : available === 0
                          ? "border-white/5 bg-white/2 opacity-40 cursor-not-allowed"
                          : "border-white/8 bg-white/3 hover:border-white/16 hover:bg-white/6"
                      }
                    `}
                    aria-pressed={isSelected}
                    id={`warehouse-${s.id}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? "bg-brand-400" : "bg-white/20"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">
                          {s.warehouse.name}
                        </p>
                        <p className="text-xs text-[hsl(220,12%,48%)]">
                          {s.warehouse.location}
                        </p>
                      </div>
                    </div>
                    <Badge variant={badgeVariant}>
                      {available === 0 ? "None" : `${available} units`}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[hsl(220,12%,48%)] italic">
            No stock data available
          </p>
        )}

        {/* Reserve action */}
        <div className="mt-auto pt-2">
          {selectedStock && selectedStock.availableUnits > 0 ? (
            <ReserveButton
              productId={product.id}
              warehouseId={selectedStock.warehouseId}
              productName={product.name}
              warehouseName={selectedStock.warehouse.name}
              onSuccess={handleReserveSuccess}
            />
          ) : (
            <button
              disabled
              className="w-full py-2.5 rounded-xl bg-white/5 text-[hsl(220,12%,40%)] text-sm font-semibold cursor-not-allowed border border-white/8"
            >
              {product.stock.length === 0
                ? "No Stock Data"
                : "Select an Available Warehouse"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
