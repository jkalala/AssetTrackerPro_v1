import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RateLimitOptions } from "../with-rate-limit";

export interface RateLimitConfig {
  [path: string]: RateLimitOptions;
}

// Default rate limit configurations for different endpoint types
export const defaultRateLimits: RateLimitConfig = {
  // Authentication endpoints - stricter limits
  "/api/auth/login": { limit: 5, window: "1m" },
  "/api/auth/mfa": { limit: 10, window: "1m" },
  "/api/auth/sessions": { limit: 20, window: "1m" },
  
  // API key management - moderate limits
  "/api/auth/api-keys": { limit: 10, window: "1m" },
  "/api/settings/api-keys": { limit: 10, window: "1m" },
  
  // General API endpoints - standard limits
  "/api/assets": { limit: 100, window: "1m" },
  "/api/analytics": { limit: 50, window: "1m" },
  
  // External API endpoints - stricter limits
  "/api/external": { limit: 30, window: "1m" },
  
  // Default fallback
  "/api": { limit: 60, window: "1m" }
};

export async function applyRateLimit(
  request: NextRequest,
  config?: RateLimitConfig
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const rateLimits = config || defaultRateLimits;
  
  // Find the most specific rate limit configuration
  let rateLimitConfig: RateLimitOptions | undefined;
  let matchedPath = "";
  
  for (const [path, options] of Object.entries(rateLimits)) {
    if (pathname.startsWith(path) && path.length > matchedPath.length) {
      rateLimitConfig = options;
      matchedPath = path;
    }
  }
  
  if (!rateLimitConfig) {
    return null; // No rate limiting configured
  }
  
  return await withRateLimit(request, rateLimitConfig);
}

export function createRateLimitMiddleware(config?: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    return await applyRateLimit(request, config);
  };
}