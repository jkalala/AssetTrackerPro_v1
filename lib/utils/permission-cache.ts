// =====================================================
// PERMISSION CACHE UTILITY
// =====================================================
// Caching utility for user permissions to improve performance

import { UserPermission } from '@/lib/types/rbac'

interface CacheEntry {
  permissions: UserPermission[]
  timestamp: number
  expiresAt: number
}

interface PermissionCheckCache {
  [key: string]: {
    granted: boolean
    timestamp: number
    expiresAt: number
  }
}

export class PermissionCache {
  private userPermissionsCache = new Map<string, CacheEntry>()
  private permissionChecksCache = new Map<string, PermissionCheckCache>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly CHECK_TTL = 2 * 60 * 1000 // 2 minutes for individual checks
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(ttl?: number) {
    if (ttl) {
      this.DEFAULT_TTL = ttl
    }
    this.startCleanupInterval()
  }

  // =====================================================
  // USER PERMISSIONS CACHING
  // =====================================================

  getUserPermissions(tenantId: string, userId: string): UserPermission[] | null {
    const key = this.getUserPermissionKey(tenantId, userId)
    const entry = this.userPermissionsCache.get(key)

    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.userPermissionsCache.delete(key)
      return null
    }

    return entry.permissions
  }

  setUserPermissions(
    tenantId: string, 
    userId: string, 
    permissions: UserPermission[], 
    ttl?: number
  ): void {
    const key = this.getUserPermissionKey(tenantId, userId)
    const now = Date.now()
    const expiresAt = now + (ttl || this.DEFAULT_TTL)

    this.userPermissionsCache.set(key, {
      permissions,
      timestamp: now,
      expiresAt
    })
  }

  clearUserPermissions(tenantId: string, userId: string): void {
    const key = this.getUserPermissionKey(tenantId, userId)
    this.userPermissionsCache.delete(key)
    
    // Also clear related permission checks
    this.clearUserPermissionChecks(tenantId, userId)
  }

  // =====================================================
  // PERMISSION CHECK CACHING
  // =====================================================

  getPermissionCheck(
    tenantId: string,
    userId: string,
    permissionName: string,
    resourceId?: string,
    contextHash?: string
  ): boolean | null {
    const userKey = this.getUserPermissionKey(tenantId, userId)
    const checkKey = this.getPermissionCheckKey(permissionName, resourceId, contextHash)
    
    const userChecks = this.permissionChecksCache.get(userKey)
    if (!userChecks) {
      return null
    }

    const check = userChecks[checkKey]
    if (!check) {
      return null
    }

    if (Date.now() > check.expiresAt) {
      delete userChecks[checkKey]
      return null
    }

    return check.granted
  }

  setPermissionCheck(
    tenantId: string,
    userId: string,
    permissionName: string,
    granted: boolean,
    resourceId?: string,
    contextHash?: string,
    ttl?: number
  ): void {
    const userKey = this.getUserPermissionKey(tenantId, userId)
    const checkKey = this.getPermissionCheckKey(permissionName, resourceId, contextHash)
    
    if (!this.permissionChecksCache.has(userKey)) {
      this.permissionChecksCache.set(userKey, {})
    }

    const userChecks = this.permissionChecksCache.get(userKey)!
    const now = Date.now()
    const expiresAt = now + (ttl || this.CHECK_TTL)

    userChecks[checkKey] = {
      granted,
      timestamp: now,
      expiresAt
    }
  }

  clearUserPermissionChecks(tenantId: string, userId: string): void {
    const userKey = this.getUserPermissionKey(tenantId, userId)
    this.permissionChecksCache.delete(userKey)
  }

  // =====================================================
  // BULK OPERATIONS
  // =====================================================

  getMultiplePermissionChecks(
    tenantId: string,
    userId: string,
    checks: Array<{
      permissionName: string
      resourceId?: string
      contextHash?: string
    }>
  ): Record<string, boolean | null> {
    const results: Record<string, boolean | null> = {}

    for (const check of checks) {
      const result = this.getPermissionCheck(
        tenantId,
        userId,
        check.permissionName,
        check.resourceId,
        check.contextHash
      )
      results[check.permissionName] = result
    }

    return results
  }

  setMultiplePermissionChecks(
    tenantId: string,
    userId: string,
    checks: Array<{
      permissionName: string
      granted: boolean
      resourceId?: string
      contextHash?: string
    }>,
    ttl?: number
  ): void {
    for (const check of checks) {
      this.setPermissionCheck(
        tenantId,
        userId,
        check.permissionName,
        check.granted,
        check.resourceId,
        check.contextHash,
        ttl
      )
    }
  }

  // =====================================================
  // CACHE INVALIDATION
  // =====================================================

  invalidateUser(tenantId: string, userId: string): void {
    this.clearUserPermissions(tenantId, userId)
    this.clearUserPermissionChecks(tenantId, userId)
  }

  invalidateTenant(tenantId: string): void {
    // Clear all entries for a tenant
    const keysToDelete: string[] = []

    for (const key of this.userPermissionsCache.keys()) {
      if (key.startsWith(`${tenantId}:`)) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.userPermissionsCache.delete(key)
      this.permissionChecksCache.delete(key)
    }
  }

  invalidatePermission(permissionName: string): void {
    // Clear all checks for a specific permission
    for (const [userKey, userChecks] of this.permissionChecksCache.entries()) {
      const checksToDelete: string[] = []
      
      for (const checkKey of Object.keys(userChecks)) {
        if (checkKey.startsWith(`${permissionName}:`)) {
          checksToDelete.push(checkKey)
        }
      }

      for (const checkKey of checksToDelete) {
        delete userChecks[checkKey]
      }
    }
  }

  clearAll(): void {
    this.userPermissionsCache.clear()
    this.permissionChecksCache.clear()
  }

  // =====================================================
  // CACHE STATISTICS
  // =====================================================

  getStats(): {
    userPermissions: {
      total: number
      expired: number
      hitRate?: number
    }
    permissionChecks: {
      total: number
      expired: number
      hitRate?: number
    }
    memoryUsage: {
      userPermissions: number
      permissionChecks: number
    }
  } {
    const now = Date.now()
    let expiredUserPermissions = 0
    let expiredPermissionChecks = 0
    let totalPermissionChecks = 0

    // Count expired user permissions
    for (const entry of this.userPermissionsCache.values()) {
      if (now > entry.expiresAt) {
        expiredUserPermissions++
      }
    }

    // Count expired permission checks
    for (const userChecks of this.permissionChecksCache.values()) {
      for (const check of Object.values(userChecks)) {
        totalPermissionChecks++
        if (now > check.expiresAt) {
          expiredPermissionChecks++
        }
      }
    }

    return {
      userPermissions: {
        total: this.userPermissionsCache.size,
        expired: expiredUserPermissions
      },
      permissionChecks: {
        total: totalPermissionChecks,
        expired: expiredPermissionChecks
      },
      memoryUsage: {
        userPermissions: this.estimateMemoryUsage(this.userPermissionsCache),
        permissionChecks: this.estimateMemoryUsage(this.permissionChecksCache)
      }
    }
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  private getUserPermissionKey(tenantId: string, userId: string): string {
    return `${tenantId}:${userId}`
  }

  private getPermissionCheckKey(
    permissionName: string,
    resourceId?: string,
    contextHash?: string
  ): string {
    const parts = [permissionName]
    if (resourceId) parts.push(resourceId)
    if (contextHash) parts.push(contextHash)
    return parts.join(':')
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 10 * 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()

    // Clean up expired user permissions
    for (const [key, entry] of this.userPermissionsCache.entries()) {
      if (now > entry.expiresAt) {
        this.userPermissionsCache.delete(key)
      }
    }

    // Clean up expired permission checks
    for (const [userKey, userChecks] of this.permissionChecksCache.entries()) {
      const checksToDelete: string[] = []
      
      for (const [checkKey, check] of Object.entries(userChecks)) {
        if (now > check.expiresAt) {
          checksToDelete.push(checkKey)
        }
      }

      for (const checkKey of checksToDelete) {
        delete userChecks[checkKey]
      }

      // Remove empty user check objects
      if (Object.keys(userChecks).length === 0) {
        this.permissionChecksCache.delete(userKey)
      }
    }
  }

  private estimateMemoryUsage(cache: Map<any, any>): number {
    // Rough estimation of memory usage in bytes
    let size = 0
    for (const [key, value] of cache.entries()) {
      size += JSON.stringify(key).length * 2 // UTF-16
      size += JSON.stringify(value).length * 2 // UTF-16
    }
    return size
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clearAll()
  }
}

// =====================================================
// CONTEXT HASHING UTILITY
// =====================================================

export function hashContext(context?: Record<string, any>): string | undefined {
  if (!context || Object.keys(context).length === 0) {
    return undefined
  }

  // Create a stable hash of the context object
  const sortedKeys = Object.keys(context).sort()
  const sortedContext = sortedKeys.reduce((acc, key) => {
    acc[key] = context[key]
    return acc
  }, {} as Record<string, any>)

  // Simple hash function (for production, consider using a proper hash library)
  const str = JSON.stringify(sortedContext)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

// =====================================================
// GLOBAL CACHE INSTANCE
// =====================================================

export const globalPermissionCache = new PermissionCache()

// Clean up on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    globalPermissionCache.destroy()
  })
}