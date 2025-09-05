/**
 * Enhanced Redis Service for AssetTrackerPro
 * Provides advanced Redis operations with fallback mechanisms
 */

import { redis, hasRedis, redisUtils } from '@/lib/config/redis'
import { Ratelimit } from '@upstash/ratelimit'

export class EnhancedRedisService {
  private static instance: EnhancedRedisService

  private constructor() {}

  public static getInstance(): EnhancedRedisService {
    if (!EnhancedRedisService.instance) {
      EnhancedRedisService.instance = new EnhancedRedisService()
    }
    return EnhancedRedisService.instance
  }

  /**
   * Check if Redis is available
   */
  public isAvailable(): boolean {
    return hasRedis && redis !== null
  }

  /**
   * Cache management
   */
  public async cache<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    if (!this.isAvailable()) {
      return await fetchFunction()
    }

    try {
      // Try to get from cache first
      const cached = await redisUtils.get(key)
      if (cached !== null) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached
      }

      // Fetch fresh data
      const freshData = await fetchFunction()

      // Cache the result
      await redisUtils.set(key, JSON.stringify(freshData), ttlSeconds)

      return freshData
    } catch (error) {
      console.error('Cache operation failed:', error)
      return await fetchFunction()
    }
  }

  /**
   * Session management
   */
  public async setSession(
    sessionId: string,
    data: any,
    ttlSeconds: number = 3600
  ): Promise<boolean> {
    const key = `session:${sessionId}`
    return await redisUtils.set(key, JSON.stringify(data), ttlSeconds)
  }

  public async getSession(sessionId: string): Promise<any> {
    const key = `session:${sessionId}`
    const data = await redisUtils.get(key)
    return data ? JSON.parse(data) : null
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`
    return await redisUtils.del(key)
  }

  /**
   * Rate limiting
   */
  public async checkRateLimit(
    identifier: string,
    limit: number = 60,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    if (!this.isAvailable()) {
      return { allowed: true, remaining: limit - 1, resetTime: Date.now() + windowSeconds * 1000 }
    }

    try {
      const ratelimit = new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.fixedWindow(limit, `${windowSeconds}s`),
        analytics: true,
      })

      const result = await ratelimit.limit(identifier)

      return {
        allowed: result.success,
        remaining: result.remaining,
        resetTime: result.reset,
      }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return { allowed: true, remaining: limit - 1, resetTime: Date.now() + windowSeconds * 1000 }
    }
  }

  /**
   * Distributed locking
   */
  public async acquireLock(
    lockKey: string,
    ttlSeconds: number = 30,
    retryAttempts: number = 3
  ): Promise<string | null> {
    if (!this.isAvailable()) {
      return `fallback-lock-${Date.now()}`
    }

    const lockValue = `lock:${Date.now()}:${Math.random()}`
    const key = `lock:${lockKey}`

    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        const result = await redis!.set(key, lockValue, { ex: ttlSeconds, nx: true })
        if (result === 'OK') {
          return lockValue
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
      } catch (error) {
        console.error(`Lock acquisition attempt ${attempt + 1} failed:`, error)
      }
    }

    return null
  }

  public async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return true // Fallback always succeeds
    }

    try {
      const key = `lock:${lockKey}`
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `

      const result = await redis!.eval(script, [key], [lockValue])
      return result === 1
    } catch (error) {
      console.error('Lock release failed:', error)
      return false
    }
  }

  /**
   * Pub/Sub messaging
   */
  public async publish(channel: string, message: any): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('Redis not available, message not published:', { channel, message })
      return false
    }

    try {
      await redis!.publish(channel, JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Publish failed:', error)
      return false
    }
  }

  /**
   * Analytics and metrics
   */
  public async incrementCounter(
    key: string,
    increment: number = 1,
    ttlSeconds?: number
  ): Promise<number> {
    if (!this.isAvailable()) {
      return increment
    }

    try {
      const result = await redis!.incrby(key, increment)
      if (ttlSeconds && result === increment) {
        await redis!.expire(key, ttlSeconds)
      }
      return result
    } catch (error) {
      console.error('Counter increment failed:', error)
      return increment
    }
  }

  public async getCounter(key: string): Promise<number> {
    const value = await redisUtils.get(key, 0)
    return typeof value === 'number' ? value : parseInt(value) || 0
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'unavailable'
    latency?: number
    error?: string
  }> {
    if (!this.isAvailable()) {
      return { status: 'unavailable' }
    }

    try {
      const start = Date.now()
      await redis!.ping()
      const latency = Date.now() - start

      return {
        status: 'healthy',
        latency,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Cleanup expired keys (maintenance)
   */
  public async cleanup(pattern: string = '*'): Promise<number> {
    if (!this.isAvailable()) {
      return 0
    }

    try {
      // Note: SCAN is more efficient than KEYS for large datasets
      const keys = await redis!.keys(pattern)
      if (keys.length === 0) return 0

      await redis!.del(...keys)
      return keys.length
    } catch (error) {
      console.error('Cleanup failed:', error)
      return 0
    }
  }
}

// Export singleton instance
export const enhancedRedisService = EnhancedRedisService.getInstance()
export default enhancedRedisService
