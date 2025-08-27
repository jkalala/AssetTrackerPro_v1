/**
 * Rate Limiting Middleware
 * Provides rate limiting wrapper for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { RateLimiterMemory } from 'rate-limiter-flexible'

// Create rate limiter instance
const rateLimiter = new RateLimiterMemory({
  points: 1000, // Number of requests
  duration: 60, // Per 60 seconds
})

export type RateLimitedHandler = (
  request: NextRequest,
  context?: Record<string, unknown>
) => Promise<NextResponse>

export function withRateLimit(handler: RateLimitedHandler) {
  return async (request: NextRequest, context?: Record<string, unknown>): Promise<NextResponse> => {
    try {
      // Get client identifier (user ID if available, otherwise IP)
      const clientId = (context as any)?.user?.id || getClientIP(request)

      // Check rate limit
      await rateLimiter.consume(clientId)

      // Proceed with the request
      return await handler(request, context)
    } catch (rejRes: Record<string, unknown>) {
      // Rate limit exceeded
      const retryAfter = Math.round(rejRes.msBeforeNext / 1000)
      
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }
  }
}

function getClientIP(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to a default value
  return 'unknown'
}