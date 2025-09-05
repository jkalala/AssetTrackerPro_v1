import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { redis, hasRedis } from '@/lib/config/redis'
import { ratelimit as sharedRatelimit } from './rate-limit'
import { NextResponse } from 'next/server'

export async function withRateLimit(req: Request, opts?: { limit?: number; window?: string }) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous'
  const limiter =
    hasRedis && opts && (opts.limit || opts.window)
      ? new Ratelimit({
          redis: redis!,
          limiter: Ratelimit.fixedWindow(opts.limit ?? 60, (opts.window as Duration) ?? '1m'),
          analytics: true,
        })
      : sharedRatelimit

  const { success, limit, remaining, reset } = await limiter.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    )
  }
  return null // No error, proceed
}
