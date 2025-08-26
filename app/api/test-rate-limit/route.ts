import { NextRequest, NextResponse } from "next/server";
import { withApiRateLimit } from "@/lib/utils/api-rate-limit";

async function handleGet(req: NextRequest) {
  return NextResponse.json({
    message: "Rate limit test successful",
    timestamp: new Date().toISOString(),
    path: req.nextUrl?.pathname || '/api/test-rate-limit'
  });
}

async function handlePost(req: NextRequest) {
  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    // Handle case where req.json() is not available (like in tests)
    body = {};
  }
  
  return NextResponse.json({
    message: "POST request successful",
    data: body,
    timestamp: new Date().toISOString()
  });
}

// Apply rate limiting with custom limits for this endpoint
export const GET = withApiRateLimit(handleGet, {
  limit: 10,
  window: "1m"
});

export const POST = withApiRateLimit(handlePost, {
  limit: 5,
  window: "1m"
});