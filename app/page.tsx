import { ProductWithStock } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { getProductsWithStock } from "@/lib/products";

export default async function HomePage() {
  let products: ProductWithStock[] = [];
  let fetchError: string | null = null;

  try {
    products = await getProductsWithStock();
  } catch {
    fetchError = "Unable to load products. Please check your database connection and try again.";
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero section */}
      <div className="text-center mb-16 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          Live Inventory — Race-Condition Safe
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
          <span className="gradient-text">StockFlow</span>{" "}
          <span className="text-white">Inventory</span>
        </h1>
        <p className="text-lg text-[hsl(220,12%,56%)] max-w-2xl mx-auto leading-relaxed">
          Browse live inventory across all warehouses. Reserve items instantly
          with a 10-minute hold — your stock is guaranteed while you checkout.
        </p>

        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-8 mt-10">
          {[
            { label: "Warehouses", value: "3" },
            { label: "Products", value: products.length.toString() },
            { label: "Reserve Time", value: "10 min" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-[hsl(220,12%,48%)] mt-1 font-medium uppercase tracking-widest">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Error state */}
      {fetchError && (
        <div
          className="glass-card rounded-2xl p-6 border-red-500/20 bg-red-500/5 text-center mb-8"
          role="alert"
        >
          <div className="text-red-400 text-4xl mb-3">⚠</div>
          <h2 className="text-red-300 font-semibold text-lg mb-2">
            Failed to Load Products
          </h2>
          <p className="text-[hsl(220,12%,56%)] text-sm">{fetchError}</p>
        </div>
      )}

      {/* Empty state */}
      {!fetchError && products.length === 0 && (
        <div className="text-center py-24 animate-fade-in">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No Products Yet
          </h2>
          <p className="text-[hsl(220,12%,56%)] text-sm">
            Run{" "}
            <code className="font-mono bg-white/8 px-2 py-0.5 rounded text-brand-300">
              npx prisma db seed
            </code>{" "}
            to populate the database.
          </p>
        </div>
      )}

      {/* Product grid */}
      {products.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              All Products
              <span className="ml-2 text-sm font-normal text-[hsl(220,12%,48%)]">
                ({products.length})
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
