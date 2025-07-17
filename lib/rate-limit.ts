import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL.startsWith("https") && !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const ratelimit = hasRedis
  ? new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.fixedWindow(60, "1 m"), // 60 requests per minute
      analytics: true,
    })
  : {
      limit: async () => ({ success: true, limit: 60, remaining: 60, reset: Date.now() + 60000 }),
    }; 