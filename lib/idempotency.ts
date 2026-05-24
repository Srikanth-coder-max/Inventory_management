import { redis } from "./redis";

const IDEMPOTENCY_TTL_SECONDS = 60 * 15; // 15 minutes

/**
 * Returns the cached response for an idempotency key, or null if not found.
 */
export async function getIdempotentResponse(
  key: string
): Promise<{ status: number; body: unknown } | null> {
  const cached = await redis.get<{ status: number; body: unknown }>(
    `idempotency:${key}`
  );
  return cached ?? null;
}

/**
 * Stores a response against an idempotency key with a 15-minute TTL.
 */
export async function setIdempotentResponse(
  key: string,
  status: number,
  body: unknown
): Promise<void> {
  await redis.set(
    `idempotency:${key}`,
    { status, body },
    { ex: IDEMPOTENCY_TTL_SECONDS }
  );
}
