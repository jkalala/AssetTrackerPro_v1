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

export interface RateLimitOptions {
  limit?: number;
  window?: string;
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export async function withRateLimit(
  req: Request,
  opts?: RateLimitOptions
): Promise<NextResponse | null> {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
  const identifier = opts?.identifier || ip;
  
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

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  const headers = {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset.toString(),
  };

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      { 
        error: "Rate limit exceeded",
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
        retryAfter,
        limit,
        remaining,
        reset
      },
      {
        status: 429,
        headers: {
          ...headers,
          "Retry-After": retryAfter.toString(),
        },
      }
    );
  }
  
  return null; // No error, proceed
}

export async function getRateLimitStatus(
  identifier: string,
  opts?: { limit?: number; window?: string }
): Promise<RateLimitResult> {
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

  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  
  return {
    success,
    limit,
    remaining,
    reset,
    retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000)
  };
} 