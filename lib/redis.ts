import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL?.trim() || "https://dummy.upstash.io",
    token: process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || "dummy-token",
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
