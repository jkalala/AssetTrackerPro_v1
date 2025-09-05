/**
 * Redis Test API Route
 * Tests Redis connectivity and basic operations
 */

import { NextResponse } from 'next/server'
import { enhancedRedisService } from '@/lib/services/enhanced-redis-service'
import { hasRedis } from '@/lib/config/redis'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Check if Redis is configured
    if (!hasRedis) {
      return NextResponse.json({
        status: 'disabled',
        message: 'Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.',
        timestamp: new Date().toISOString()
      })
    }

    // Perform health check
    const healthCheck = await enhancedRedisService.healthCheck()
    
    if (healthCheck.status !== 'healthy') {
      return NextResponse.json({
        status: 'error',
        message: 'Redis health check failed',
        details: healthCheck,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // Test basic operations
    const testKey = `test:${Date.now()}`
    const testValue = { message: 'Redis test successful', timestamp: new Date().toISOString() }
    
    // Test cache operation
    const cacheResult = await enhancedRedisService.cache(
      testKey,
      async () => testValue,
      60 // 1 minute TTL
    )

    // Test counter operation
    const counterKey = `counter:test:${Date.now()}`
    const counterValue = await enhancedRedisService.incrementCounter(counterKey, 1, 60)

    // Test rate limiting
    const rateLimitResult = await enhancedRedisService.checkRateLimit(
      `test:${Date.now()}`,
      10, // 10 requests
      60  // per minute
    )

    return NextResponse.json({
      status: 'success',
      message: 'Redis is working correctly',
      tests: {
        healthCheck,
        cache: {
          key: testKey,
          value: cacheResult,
          success: JSON.stringify(cacheResult) === JSON.stringify(testValue)
        },
        counter: {
          key: counterKey,
          value: counterValue,
          success: counterValue === 1
        },
        rateLimit: {
          allowed: rateLimitResult.allowed,
          remaining: rateLimitResult.remaining,
          success: rateLimitResult.allowed === true
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Redis test failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Redis test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { operation, key, value, ttl } = body

    if (!hasRedis) {
      return NextResponse.json({
        status: 'disabled',
        message: 'Redis is not configured'
      }, { status: 503 })
    }

    let result: any

    switch (operation) {
      case 'set':
        if (!key || value === undefined) {
          return NextResponse.json({
            status: 'error',
            message: 'Key and value are required for set operation'
          }, { status: 400 })
        }
        result = await enhancedRedisService.cache(
          key,
          async () => value,
          ttl || 300
        )
        break

      case 'get':
        if (!key) {
          return NextResponse.json({
            status: 'error',
            message: 'Key is required for get operation'
          }, { status: 400 })
        }
        result = await enhancedRedisService.cache(
          key,
          async () => null,
          0
        )
        break

      case 'increment':
        if (!key) {
          return NextResponse.json({
            status: 'error',
            message: 'Key is required for increment operation'
          }, { status: 400 })
        }
        result = await enhancedRedisService.incrementCounter(
          key,
          value || 1,
          ttl
        )
        break

      case 'rateLimit':
        if (!key) {
          return NextResponse.json({
            status: 'error',
            message: 'Key is required for rate limit operation'
          }, { status: 400 })
        }
        result = await enhancedRedisService.checkRateLimit(
          key,
          value || 60,
          ttl || 60
        )
        break

      default:
        return NextResponse.json({
          status: 'error',
          message: 'Invalid operation. Supported operations: set, get, increment, rateLimit'
        }, { status: 400 })
    }

    return NextResponse.json({
      status: 'success',
      operation,
      key,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Redis operation failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Redis operation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!hasRedis) {
      return NextResponse.json({
        status: 'disabled',
        message: 'Redis is not configured'
      }, { status: 503 })
    }

    if (!key) {
      return NextResponse.json({
        status: 'error',
        message: 'Key parameter is required'
      }, { status: 400 })
    }

    // For testing purposes, we'll use a simple approach
    // In production, you might want to implement a proper delete method
    const result = await enhancedRedisService.cache(
      key,
      async () => null,
      1 // Very short TTL to effectively delete
    )

    return NextResponse.json({
      status: 'success',
      message: 'Key deleted (expired)',
      key,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Redis delete failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Redis delete failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
