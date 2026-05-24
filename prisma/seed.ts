import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { Decimal } from "@prisma/client/runtime/client";



const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? process.env.DIRECT_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log("🌱 Seeding database...");

  // ── Clean slate ────────────────────────────────────────────────────────────
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  // ── Warehouses ─────────────────────────────────────────────────────────────
  const [wh1, wh2, wh3] = await Promise.all([
    prisma.warehouse.create({
      data: { name: "East Coast Hub", location: "New York, NY" },
    }),
    prisma.warehouse.create({
      data: { name: "West Coast Hub", location: "Los Angeles, CA" },
    }),
    prisma.warehouse.create({
      data: { name: "Central Distribution", location: "Chicago, IL" },
    }),
  ]);

  console.log(`✅ Created 3 warehouses`);

  // ── Products ───────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Wireless Noise-Cancelling Headphones",
        description:
          "Premium over-ear headphones with 30-hour battery life, active noise cancellation, and crystal-clear audio. Perfect for travel and remote work.",
        price: new Decimal("249.99"),
        sku: "WH-NC-001",
        imageUrl: null,
      },
    }),
    prisma.product.create({
      data: {
        name: "Ergonomic Mechanical Keyboard",
        description:
          "Split-layout mechanical keyboard with Cherry MX switches, RGB backlighting, and wrist rest. Reduces RSI for heavy typers.",
        price: new Decimal("189.99"),
        sku: "KBD-MECH-002",
        imageUrl: null,
      },
    }),
    prisma.product.create({
      data: {
        name: "4K Ultra-Wide Monitor",
        description:
          "34-inch curved ultra-wide display with 144Hz refresh rate, HDR400, and USB-C connectivity. Immersive productivity powerhouse.",
        price: new Decimal("799.99"),
        sku: "MON-4K-003",
        imageUrl: null,
      },
    }),
    prisma.product.create({
      data: {
        name: "Portable SSD 2TB",
        description:
          "Blazing-fast NVMe portable SSD with 2000MB/s read speeds, USB 3.2 Gen 2, shock-resistant aluminum chassis.",
        price: new Decimal("149.99"),
        sku: "SSD-2TB-004",
        imageUrl: null,
      },
    }),
    prisma.product.create({
      data: {
        name: "Smart Standing Desk",
        description:
          "Motorized height-adjustable desk with memory presets, anti-collision detection, and solid bamboo surface. Sit-stand made easy.",
        price: new Decimal("649.99"),
        sku: "DESK-STAND-005",
        imageUrl: null,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // ── Stock allocations ──────────────────────────────────────────────────────
  const stockData = [
    // Headphones
    { productId: products[0].id, warehouseId: wh1.id, totalUnits: 50, reservedUnits: 0 },
    { productId: products[0].id, warehouseId: wh2.id, totalUnits: 30, reservedUnits: 0 },
    { productId: products[0].id, warehouseId: wh3.id, totalUnits: 20, reservedUnits: 0 },
    // Keyboard
    { productId: products[1].id, warehouseId: wh1.id, totalUnits: 75, reservedUnits: 0 },
    { productId: products[1].id, warehouseId: wh2.id, totalUnits: 40, reservedUnits: 0 },
    { productId: products[1].id, warehouseId: wh3.id, totalUnits: 35, reservedUnits: 0 },
    // Monitor (scarce to demo 409)
    { productId: products[2].id, warehouseId: wh1.id, totalUnits: 5, reservedUnits: 0 },
    { productId: products[2].id, warehouseId: wh2.id, totalUnits: 3, reservedUnits: 0 },
    { productId: products[2].id, warehouseId: wh3.id, totalUnits: 8, reservedUnits: 0 },
    // Portable SSD
    { productId: products[3].id, warehouseId: wh1.id, totalUnits: 100, reservedUnits: 0 },
    { productId: products[3].id, warehouseId: wh2.id, totalUnits: 80, reservedUnits: 0 },
    { productId: products[3].id, warehouseId: wh3.id, totalUnits: 60, reservedUnits: 0 },
    // Standing Desk
    { productId: products[4].id, warehouseId: wh1.id, totalUnits: 15, reservedUnits: 0 },
    { productId: products[4].id, warehouseId: wh2.id, totalUnits: 10, reservedUnits: 0 },
    { productId: products[4].id, warehouseId: wh3.id, totalUnits: 12, reservedUnits: 0 },
  ];

  await prisma.stock.createMany({ data: stockData });

  console.log(`✅ Created ${stockData.length} stock records`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
