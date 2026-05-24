# Inventory Management

A simple inventory management web application built with Next.js, Prisma, and Redis.

## Features

- User authentication
- Product catalog
- Reservations and stock management

## Requirements

- Node.js 18+ (or compatible)
- npm or pnpm
- A PostgreSQL/MySQL/SQLite database supported by Prisma
- Redis (optional, used for locking/idempotency)

## Quick start

1. Install dependencies

```bash
npm install
# or: pnpm install
```

2. Create environment file

```bash
cp .env.example .env
# Edit .env to set DATABASE_URL, NEXTAUTH_SECRET, REDIS_URL, etc.
```

3. Run Prisma migrations and seed (if applicable)

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

4. Run development server

```bash
npm run dev
# or: pnpm dev
```

## Useful scripts

- `dev` — start Next.js in development mode
- `build` — build for production
- `start` — run production build

## Project structure

- `app/` — Next.js app routes and pages
- `lib/` — server-side helpers (Prisma, Redis, utilities)
- `components/` — React components
- `prisma/` — Prisma schema and seeds

## Notes

- Ensure `DATABASE_URL` and any required auth secrets are set before running migrations.
- If you plan to push commits to GitHub, ensure your repository remote (`origin`) is configured and you have push access.

---

If you want any extra sections (badges, CI setup, contributing guide), tell me and I can add them.
# StockFlow — Multi-Warehouse Inventory & D2C Order-Fulfillment Platform

A production-grade inventory management and order-fulfillment system for multi-warehouse retail and D2C brands. Built to solve real-world stock race conditions using a short-lived reservation system with ACID-compliant pessimistic locking and Redis distributed locks.

---

## Tech Stack

| Layer         | Technology                              |
|---------------|-----------------------------------------|
| Framework     | Next.js 15 (App Router)                 |
| Language      | TypeScript (strict mode)                |
| ORM & DB      | Prisma + PostgreSQL (Supabase / Neon)   |
| Caching/Lock  | Upstash Redis                           |
| Styling       | Tailwind CSS (v4)                       |
| Validation    | Hand-rolled TypeScript type guards  |

---

## Local Setup

### 1. Clone and install

```bash
cd "Inventory Management"
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable                    | Description                                         |
|-----------------------------|-----------------------------------------------------|
| `DATABASE_URL`              | PostgreSQL pooling URL (use PgBouncer port 6543 on Supabase/Neon) |
| `DIRECT_URL`                | Direct PostgreSQL URL for migrations (port 5432)   |
| `UPSTASH_REDIS_REST_URL`    | Upstash Redis REST endpoint                        |
| `UPSTASH_REDIS_REST_TOKEN`  | Upstash Redis auth token                           |
| `NEXT_PUBLIC_BASE_URL`      | `http://localhost:3000` locally                    |
| `CRON_SECRET`               | Random string protecting `/api/cron/cleanup`       |

### 3. Set up the database

```bash
# Push schema to your database (creates tables)
npm run db:push

# OR run migrations (preferred for production)
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# Seed with sample data
npm run db:seed
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

### Database Schema

```
Product ─────┐
             ├──→ Stock (unique per productId+warehouseId)
Warehouse ───┘
             └──→ Reservation (PENDING → CONFIRMED | RELEASED)
```

Four Prisma models:
- **`Product`**: catalog with SKU, price, description
- **`Warehouse`**: fulfillment locations
- **`Stock`**: `totalUnits` + `reservedUnits` per (product, warehouse); unique constraint enforced at DB level
- **`Reservation`**: short-lived holds with status lifecycle and expiry timestamp

### API Routes

| Method | Route                               | Description                          |
|--------|-------------------------------------|--------------------------------------|
| GET    | `/api/products`                     | All products with per-warehouse stock |
| GET    | `/api/warehouses`                   | All warehouses                       |
| POST   | `/api/reservations`                 | Create a 10-minute hold              |
| GET    | `/api/reservations/:id`             | Fetch reservation details            |
| POST   | `/api/reservations/:id/confirm`     | Confirm purchase (PENDING→CONFIRMED) |
| POST   | `/api/reservations/:id/release`     | Cancel reservation (PENDING→RELEASED)|
| GET    | `/api/cron/cleanup`                 | Batch cleanup of expired reservations|

---

## Concurrency Architecture

### The Problem
When two users simultaneously request the last unit of stock, a naive implementation reads `available = 1` for both, then increments `reservedUnits` twice — resulting in negative effective stock and overselling.

### The Solution: Two-Layer Lock

#### Layer 1 — Redis Distributed Lock (`lib/lock.ts`)
Before touching the database, a Redis `SET NX PX` lock is acquired for the key `lock:stock:{productId}:{warehouseId}`. This lock:
- Is atomic (single round-trip to Redis)
- Has a 5-second TTL to prevent deadlocks
- Retries up to 10 times with 50ms backoff
- Returns a typed release function for cleanup in `finally` blocks

This prevents **connection pile-up** at the database level under extreme concurrent load.

#### Layer 2 — PostgreSQL Pessimistic Row Lock (`SELECT ... FOR UPDATE`)
Inside a Prisma interactive transaction, the exact `Stock` row is locked at the database level:

```sql
SELECT id, "totalUnits", "reservedUnits"
FROM stock
WHERE "productId" = $1
  AND "warehouseId" = $2
FOR UPDATE
```

**Critical implementation note**: The query uses `tx.$queryRaw` — the **transaction client token** — not the global `prisma.$queryRaw`. This ensures the lock executes inside the correct transaction boundary, so the row remains locked until the transaction commits or rolls back. Using the global Prisma client would run the query outside the transaction, defeating the locking entirely.

#### Why both layers?
- **Redis lock** prevents thundering-herd DB connections; fast rejection at the application layer
- **`SELECT FOR UPDATE`** provides ACID-compliant correctness at the storage layer
- Together they handle both distributed concurrency AND database-level race conditions

#### Flow for `POST /api/reservations`:
```
Request → Idempotency check → Acquire Redis lock
  → BEGIN transaction
    → SELECT stock FOR UPDATE   ← row is locked for this tx
    → Check available >= quantity
    → If yes: UPDATE reservedUnits, INSERT reservation
    → COMMIT
  → Release Redis lock
  → Cache idempotency response
  → Return 201 | 409
```

---

## Expiry Mechanism

Reservations have a 10-minute TTL (`expiresAt = now + 600s`).

### Lazy Cleanup on Read
`GET /api/products` calls `runLazyCleanup()` before returning stock data. This:
1. Finds all `PENDING` reservations where `expiresAt < NOW()`
2. Groups them by `(productId, warehouseId)` to batch decrements
3. Executes a single transaction: `UPDATE reservations SET status='RELEASED'` + `UPDATE stock SET reservedUnits -= quantity`

This ensures stale reservations are always cleaned before stock availability is shown.

### Vercel Cron Job
`vercel.json` schedules `GET /api/cron/cleanup` to run every 5 minutes in production. Protected by `Authorization: Bearer <CRON_SECRET>`.

### Checkout UI Timer
The checkout page implements a client-side countdown using `useEffect` + `setInterval`. When the timer reaches 0, the UI transitions to an "Expired" state without requiring a page reload. The timer also enters an "urgent" mode (red, pulsing) in the final 2 minutes.

---

## Idempotency System

`POST /api/reservations` and `POST /api/reservations/:id/confirm` accept an optional `Idempotency-Key` header.

- **Cache location**: Upstash Redis, key `idempotency:{key}` (or `idempotency:confirm:{key}`)
- **TTL**: 15 minutes
- **Behavior**: If an identical key is received, the cached `{status, body}` is returned immediately without executing any DB operations

This prevents duplicate reservations from network retries.

---

## Frontend Pages

### `/` — Product Listing
- Server Component; fetches live data with `cache: 'no-store'`
- Grid of `ProductCard` components with warehouse selector
- "Reserve" button triggers `POST /api/reservations` with loading state
- Toast notifications for 409 (out of stock), 503 (lock contention), network errors
- On success: navigates to `/checkout/{reservationId}`

### `/checkout/[reservationId]` — Checkout
- Server Component fetches reservation, passes to `CheckoutClient`
- Real-time countdown timer (MM:SS) with progress bar
- "Confirm Purchase" → `POST /api/reservations/:id/confirm`
- "Cancel" → `POST /api/reservations/:id/release`
- All state transitions (confirmed, expired, released) update reactively without page reload
- Handles `410 Gone` (expired) and `409 Conflict` (already processed) with inline alerts

---

## Trade-offs & Design Decisions

| Decision | Rationale |
|----------|-----------|
| No Zod | Keeps dependencies clean; type guards are simple given the small API surface |
| `tx.$queryRaw` for `FOR UPDATE` | Prisma ORM doesn't expose row-level locks through its fluent API; raw SQL in the tx boundary is the only correct approach |
| Redis lock + DB lock (dual layer) | Redis protects DB connections under load; DB lock provides ACID correctness |
| Lazy cleanup (read-time) | Eliminates need for a standalone background worker; compatible with serverless |
| Vercel Cron as backstop | Catches stale reservations even if reads are infrequent |
| No global Prisma.$queryRaw | If accidentally used outside tx, the lock wouldn't be held within the transaction — a correctness bug disguised as working code |
| Decimal serialized as string | Avoids floating-point precision loss when transmitting monetary values over JSON |
| Idempotency in Redis | 15-min TTL matches reservation lifecycle; Redis is already in-process for locking |

---

## Deployment (Vercel + Supabase/Neon)

1. Push code to GitHub
2. Connect repo in Vercel dashboard
3. Add all environment variables from `.env.example`
4. Vercel auto-detects Next.js and configures build
5. Cron job from `vercel.json` is automatically registered

```bash
# After first deployment, run migrations
npx prisma migrate deploy

# Then seed (from local with remote DATABASE_URL)
npm run db:seed
```
