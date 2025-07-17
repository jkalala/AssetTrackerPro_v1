import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ratelimit as sharedRatelimit } from "./rate-limit";
import { NextResponse } from "next/server";

const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL.startsWith("https") && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export async function withRateLimit(
  req: Request,
  opts?: { limit?: number; window?: string }
) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const limiter =
    hasRedis && opts && (opts.limit || opts.window)
      ? new Ratelimit({
          redis: redis!,
          limiter: Ratelimit.fixedWindow(
            opts.limit ?? 60,
            (opts.window as Duration) ?? "1m"
          ),
          analytics: true,
        })
      : sharedRatelimit;

  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      }
    );
  }
  return null; // No error, proceed
} 