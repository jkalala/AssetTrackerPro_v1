// =====================================================
// API KEY AUTHENTICATION MIDDLEWARE
// =====================================================
// Middleware for validating API keys and enforcing permissions

import { NextRequest, NextResponse } from 'next/server'
import { apiKeyService } from '@/lib/services/api-key-service'

export interface ApiKeyAuthOptions {
  requiredPermission?: string
  requiredScope?: string
  skipRateLimit?: boolean
}

export interface ApiKeyContext {
  apiKey: any
  tenantId: string
  userId: string
}

/**
 * Middleware to authenticate and validate API keys
 */
export async function withApiKeyAuth(
  request: NextRequest,
  options: ApiKeyAuthOptions = {}
): Promise<{ success: boolean; context?: ApiKeyContext; response?: NextResponse }> {
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('authorization')
    const apiKey = extractApiKeyFromHeader(authHeader)

    if (!apiKey) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'API key required' },
          { status: 401 }
        )
      }
    }

    // Get client IP address
    const ipAddress = getClientIpAddress(request)

    // Validate API key
    const validation = await apiKeyService.validateApiKey(
      apiKey,
      options.requiredPermission,
      options.requiredScope,
      ipAddress
    )

    if (!validation.valid) {
      const status = validation.rateLimitExceeded ? 429 : 401
      return {
        success: false,
        response: NextResponse.json(
          { error: validation.error },
          { status }
        )
      }
    }

    // Log API usage (unless skipped)
    if (!options.skipRateLimit) {
      const url = new URL(request.url)
      await apiKeyService.logApiKeyUsage(
        validation.apiKey!,
        url.pathname,
        request.method,
        200, // Will be updated with actual status code later
        {
          ipAddress,
          userAgent: request.headers.get('user-agent') || undefined
        }
      )
    }

    return {
      success: true,
      context: {
        apiKey: validation.apiKey!,
        tenantId: validation.apiKey!.tenant_id,
        userId: validation.apiKey!.user_id
      }
    }
  } catch (error) {
    console.error('API key authentication error:', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Higher-order function to wrap API routes with API key authentication
 */
export function requireApiKey(
  handler: (request: NextRequest, context: ApiKeyContext) => Promise<NextResponse>,
  options: ApiKeyAuthOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await withApiKeyAuth(request, options)
    
    if (!auth.success) {
      return auth.response!
    }

    try {
      const response = await handler(request, auth.context!)
      
      // Update usage log with actual response status
      if (!options.skipRateLimit) {
        const url = new URL(request.url)
        await apiKeyService.logApiKeyUsage(
          auth.context!.apiKey,
          url.pathname,
          request.method,
          response.status,
          {
            ipAddress: getClientIpAddress(request),
            userAgent: request.headers.get('user-agent') || undefined
          }
        )
      }

      return response
    } catch (error) {
      console.error('API route error:', error)
      
      // Log error in usage
      if (!options.skipRateLimit) {
        const url = new URL(request.url)
        await apiKeyService.logApiKeyUsage(
          auth.context!.apiKey,
          url.pathname,
          request.method,
          500,
          {
            ipAddress: getClientIpAddress(request),
            userAgent: request.headers.get('user-agent') || undefined
          }
        )
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Extract API key from Authorization header
 */
function extractApiKeyFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null

  // Support both "Bearer" and "ApiKey" prefixes
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch) return bearerMatch[1]

  const apiKeyMatch = authHeader.match(/^ApiKey\s+(.+)$/i)
  if (apiKeyMatch) return apiKeyMatch[1]

  // Support direct API key without prefix
  if (authHeader.startsWith('ak_')) return authHeader

  return null
}

/**
 * Get client IP address from request
 */
function getClientIpAddress(request: NextRequest): string {
  // Check various headers for the real IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback to localhost since NextRequest doesn't have ip property
  return '127.0.0.1'
}

/**
 * Middleware to add rate limiting headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  rateLimitStatus: {
    allowed: boolean
    remaining: number
    resetTime: Date
    limit: number
  }
): NextResponse {
  response.headers.set('X-RateLimit-Limit', rateLimitStatus.limit.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimitStatus.remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitStatus.resetTime.getTime() / 1000).toString())

  if (!rateLimitStatus.allowed) {
    response.headers.set('Retry-After', Math.ceil((rateLimitStatus.resetTime.getTime() - Date.now()) / 1000).toString())
  }

  return response
}

/**
 * Create a standardized API error response
 */
export function createApiErrorResponse(
  error: string,
  status: number = 400,
  details?: Record<string, any>
): NextResponse {
  const body: any = { error }
  
  if (details) {
    body.details = details
  }

  return NextResponse.json(body, { status })
}

/**
 * Create a standardized API success response
 */
export function createApiSuccessResponse(
  data: any,
  status: number = 200
): NextResponse {
  return NextResponse.json({
    success: true,
    data
  }, { status })
}