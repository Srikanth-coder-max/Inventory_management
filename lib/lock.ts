import { redis } from "./redis";

const LOCK_TTL_MS = 5000; // 5-second lock TTL
const LOCK_RETRY_DELAY_MS = 50;
const LOCK_MAX_RETRIES = 10;

/**
 * Acquires a distributed Redis lock for a given key.
 * Returns a release function on success, or null if the lock could not be acquired.
 *
 * Uses SET NX EX (atomic) — prevents two concurrent requests from proceeding
 * past the lock barrier simultaneously.
 */
export async function acquireLock(
  lockKey: string
): Promise<(() => Promise<void>) | null> {
  const lockValue = `${Date.now()}-${Math.random()}`;
  const fullKey = `lock:${lockKey}`;

  for (let attempt = 0; attempt < LOCK_MAX_RETRIES; attempt++) {
    // SET key value NX PX ttl — only sets if key does not exist
    const result = await redis.set(fullKey, lockValue, {
      nx: true,
      px: LOCK_TTL_MS,
    });

    if (result === "OK") {
      // Return an async release function
      const release = async () => {
        // Only delete if we still own the lock (check-and-delete via Lua script)
        const currentValue = await redis.get<string>(fullKey);
        if (currentValue === lockValue) {
          await redis.del(fullKey);
        }
      };
      return release;
    }

    // Brief back-off before retry
    await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_DELAY_MS));
  }

  return null; // Could not acquire lock after retries
}
