import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RateLimitOptions } from "../with-rate-limit";

/**
 * Enhances an existing API handler with rate limiting
 */
export function enhanceWithRateLimit<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T,
  options?: RateLimitOptions
): T {
  return (async (req: NextRequest, ...args: unknown[]) => {
    // Apply rate limiting first
    const rateLimitResponse = await withRateLimit(req, options);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Call the original handler
    const response = await handler(req, ...args);
    
    // Add rate limit headers to successful responses if they don't exist
    if (response.status < 400) {
      const headers = new Headers(response.headers);
      
      // Only add headers if they're not already present
      if (!headers.has('X-RateLimit-Limit')) {
        // We can't easily get the current rate limit status without calling the limiter again
        // So we'll just add basic headers
        headers.set('X-RateLimit-Limit', (options?.limit || 60).toString());
      }
      
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }
    
    return response;
  }) as T;
}

/**
 * Creates a rate-limited version of multiple HTTP method handlers
 */
export function createRateLimitedHandlers(
  handlers: {
    GET?: (req: NextRequest, context?: Record<string, unknown>) => Promise<NextResponse>;
    POST?: (req: NextRequest, context?: Record<string, unknown>) => Promise<NextResponse>;
    PUT?: (req: NextRequest, context?: Record<string, unknown>) => Promise<NextResponse>;
    DELETE?: (req: NextRequest, context?: Record<string, unknown>) => Promise<NextResponse>;
    PATCH?: (req: NextRequest, context?: Record<string, unknown>) => Promise<NextResponse>;
  },
  options?: RateLimitOptions | Record<string, RateLimitOptions>
) {
  const result: Record<string, unknown> = {};
  
  for (const [method, handler] of Object.entries(handlers)) {
    if (handler) {
      const methodOptions = typeof options === 'object' && !Array.isArray(options) && 'limit' in options 
        ? options 
        : (options as Record<string, RateLimitOptions>)?.[method] || options;
      
      result[method] = enhanceWithRateLimit(handler as any, methodOptions as RateLimitOptions);
    }
  }
  
  return result;
}