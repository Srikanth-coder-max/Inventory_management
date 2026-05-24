import { prisma } from "@/lib/prisma";
import { runLazyCleanup } from "@/lib/cleanup";
import type { ProductWithStock } from "@/types";

export async function getProductsWithStock(): Promise<ProductWithStock[]> {
  await runLazyCleanup();

  const products = await prisma.product.findMany({
    include: {
      stock: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return products.map((product) => ({
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    price: product.price.toString(),
    stock: product.stock.map((stock) => ({
      ...stock,
      createdAt: stock.createdAt.toISOString(),
      updatedAt: stock.updatedAt.toISOString(),
      availableUnits: stock.totalUnits - stock.reservedUnits,
      warehouse: {
        ...stock.warehouse,
        createdAt: stock.warehouse.createdAt.toISOString(),
        updatedAt: stock.warehouse.updatedAt.toISOString(),
      },
    })),
  }));
}