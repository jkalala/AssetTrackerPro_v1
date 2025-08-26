import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RateLimitOptions } from "../with-rate-limit";

export interface ApiRateLimitOptions extends RateLimitOptions {
  skipRateLimit?: boolean;
}

export function withApiRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: ApiRateLimitOptions
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Skip rate limiting if explicitly disabled
    if (options?.skipRateLimit) {
      return handler(req);
    }

    // Apply rate limiting
    const rateLimitResponse = await withRateLimit(req, options);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Proceed with the original handler
    try {
      const response = await handler(req);
      
      // Add rate limit headers to successful responses
      const headers = new Headers(response.headers);
      const rateLimitHeaders = [
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining", 
        "X-RateLimit-Reset"
      ];
      
      // If the response doesn't have rate limit headers, we can't add them
      // as we'd need to call the rate limiter again
      
      return response;
    } catch (error) {
      console.error("API handler error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

export function createRateLimitedHandler(
  handlers: {
    GET?: (req: NextRequest) => Promise<NextResponse>;
    POST?: (req: NextRequest) => Promise<NextResponse>;
    PUT?: (req: NextRequest) => Promise<NextResponse>;
    DELETE?: (req: NextRequest) => Promise<NextResponse>;
    PATCH?: (req: NextRequest) => Promise<NextResponse>;
  },
  options?: ApiRateLimitOptions
) {
  const rateLimitedHandlers: any = {};

  for (const [method, handler] of Object.entries(handlers)) {
    if (handler) {
      rateLimitedHandlers[method] = withApiRateLimit(handler, options);
    }
  }

  return rateLimitedHandlers;
}