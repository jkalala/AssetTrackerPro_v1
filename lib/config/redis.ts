/**
 * Redis Configuration for AssetTrackerPro
 * Uses Upstash Redis for serverless compatibility
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Environment variables for Redis configuration
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// Check if Redis is properly configured
export const hasRedis = !!(
  UPSTASH_REDIS_REST_URL &&
  UPSTASH_REDIS_REST_URL.startsWith('https') &&
  UPSTASH_REDIS_REST_TOKEN
)

// Redis client configuration
export const redis = hasRedis
  ? new Redis({
      url: UPSTASH_REDIS_REST_URL!,
      token: UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Default rate limiting configuration
export const defaultRateLimit = hasRedis
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.fixedWindow(60, '1m'), // 60 requests per minute
      analytics: true,
    })
  : {
      limit: async () => ({
        success: true,
        limit: 60,
        remaining: 60,
        reset: Date.now() + 60000,
      }),
    }

// Redis configuration for different environments
export const redisConfig = {
  // Development configuration
  development: {
    enabled: hasRedis,
    url: UPSTASH_REDIS_REST_URL,
    // Don't log token in development
    hasToken: !!UPSTASH_REDIS_REST_TOKEN,
  },

  // Production configuration
  production: {
    enabled: hasRedis,
    url: UPSTASH_REDIS_REST_URL,
    hasToken: !!UPSTASH_REDIS_REST_TOKEN,
  },

  // Test configuration
  test: {
    enabled: false, // Disable Redis in tests by default
    url: null,
    hasToken: false,
  },
}

// Get current environment configuration
export const currentRedisConfig =
  redisConfig[process.env.NODE_ENV as keyof typeof redisConfig] || redisConfig.development

// Redis utility functions
export const redisUtils = {
  /**
   * Check if Redis is available and connected
   */
  async isConnected(): Promise<boolean> {
    if (!hasRedis || !redis) return false

    try {
      await redis.ping()
      return true
    } catch (error) {
      console.error('Redis connection check failed:', error)
      return false
    }
  },

  /**
   * Get a value from Redis with fallback
   */
  async get(key: string, fallback: unknown = null): Promise<unknown> {
    if (!hasRedis || !redis) return fallback

    try {
      const value = await redis.get(key)
      return value !== null ? value : fallback
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error)
      return fallback
    }
  },

  /**
   * Set a value in Redis with optional TTL
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    if (!hasRedis || !redis) return false

    try {
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, value)
      } else {
        await redis.set(key, value)
      }
      return true
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error)
      return false
    }
  },

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<boolean> {
    if (!hasRedis || !redis) return false

    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error)
      return false
    }
  },

  /**
   * Increment a counter in Redis
   */
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (!hasRedis || !redis) return 1

    try {
      const result = await redis.incr(key)
      if (ttlSeconds && result === 1) {
        // Set TTL only on first increment
        await redis.expire(key, ttlSeconds)
      }
      return result
    } catch (error) {
      console.error(`Redis INCR error for key ${key}:`, error)
      return 1
    }
  },
}

// Export Redis instance for direct use
export { redis as redisClient }
export default redis
