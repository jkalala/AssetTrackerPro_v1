// =====================================================
// TENANT CONTEXT MIDDLEWARE UTILITIES
// =====================================================
// Enhanced utilities for managing tenant context in middleware and API routes

import { NextRequest, NextResponse } from 'next/server'
import { tenantService } from '@/lib/services/tenant-service'
import { rlsManager } from '@/lib/security/rls-utils'
import { tenantConfig } from '@/lib/config/tenant-config'
import { TenantContext } from '@/lib/types/database'

// =====================================================
// TENANT CONTEXT MANAGER
// =====================================================

export class TenantContextManager {
  /**
   * Extract tenant context from request headers
   */
  static getTenantContextFromHeaders(req: NextRequest): TenantContext | null {
    const tenantId = req.headers.get('x-tenant-id')
    const userId = req.headers.get('x-user-id')
    const role = req.headers.get('x-user-role')
    const permissions = req.headers.get('x-user-permissions')

    if (!tenantId || !userId || !role) {
      return null
    }

    return {
      tenantId,
      userId,
      role: role as any,
      permissions: permissions ? JSON.parse(permissions) : {}
    }
  }

  /**
   * Validate tenant context and permissions
   */
  static async validateTenantContext(
    context: TenantContext,
    requiredRole?: string | string[],
    requiredPermissions?: string[]
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Validate tenant access
      const hasAccess = await rlsManager.validateTenantAccess(context.userId, context.tenantId)
      if (!hasAccess) {
        return { valid: false, error: 'Invalid tenant access' }
      }

      // Check role requirements
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
        if (!roles.includes(context.role) && !['owner', 'admin'].includes(context.role)) {
          return { valid: false, error: 'Insufficient role permissions' }
        }
      }

      // Check specific permissions
      if (requiredPermissions && requiredPermissions.length > 0) {
        const userPermissions = context.permissions as Record<string, boolean> || {}
        const hasAllPermissions = requiredPermissions.every(perm => userPermissions[perm] === true)
        
        if (!hasAllPermissions && !['owner', 'admin'].includes(context.role)) {
          return { valid: false, error: 'Missing required permissions' }
        }
      }

      return { valid: true }
    } catch (error) {
      console.error('Error validating tenant context:', error)
      return { valid: false, error: 'Context validation failed' }
    }
  }

  /**
   * Set tenant context for database operations
   */
  static async setDatabaseContext(context: TenantContext): Promise<void> {
    await rlsManager.setRLSContext(context)
  }

  /**
   * Clear tenant context
   */
  static async clearDatabaseContext(): Promise<void> {
    await rlsManager.clearRLSContext()
  }

  /**
   * Create tenant-aware response with context headers
   */
  static createTenantResponse(
    data: any,
    context: TenantContext,
    status: number = 200
  ): NextResponse {
    const response = NextResponse.json(data, { status })
    
    // Add tenant context headers
    response.headers.set('x-tenant-id', context.tenantId)
    response.headers.set('x-user-id', context.userId)
    response.headers.set('x-user-role', context.role)
    
    return response
  }
}

// =====================================================
// TENANT FEATURE MANAGER
// =====================================================

export class TenantFeatureManager {
  /**
   * Check if tenant has access to specific feature
   */
  static async checkFeatureAccess(
    tenantId: string,
    feature: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: tenant } = await tenantService.getTenant(tenantId)
      if (!tenant) {
        return { allowed: false, reason: 'Tenant not found' }
      }

      const hasFeature = tenantConfig.isFeatureEnabled(tenant, feature as any)
      if (!hasFeature) {
        return { allowed: false, reason: `Feature ${feature} not available for plan ${tenant.plan}` }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking feature access:', error)
      return { allowed: false, reason: 'Feature check failed' }
    }
  }

  /**
   * Get tenant usage limits
   */
  static async getTenantLimits(tenantId: string): Promise<{
    assets: { current: number; limit: number }
    users: { current: number; limit: number }
    storage: { current: number; limit: number }
  } | null> {
    try {
      const { data: usage } = await tenantService.getTenantUsage(tenantId)
      return usage
    } catch (error) {
      console.error('Error getting tenant limits:', error)
      return null
    }
  }

  /**
   * Check if tenant can perform action based on limits
   */
  static async checkActionLimit(
    tenantId: string,
    action: 'create_asset' | 'create_user' | 'upload_file',
    size?: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const result = await tenantService.canPerformAction(tenantId, action, size)
      return result
    } catch (error) {
      console.error('Error checking action limit:', error)
      return { allowed: false, reason: 'Limit check failed' }
    }
  }
}

// =====================================================
// TENANT SECURITY MANAGER
// =====================================================

export class TenantSecurityManager {
  /**
   * Log security event for tenant
   */
  static async logSecurityEvent(
    tenantId: string,
    userId: string,
    event: string,
    details: Record<string, any>,
    req?: NextRequest
  ): Promise<void> {
    try {
      const eventData = {
        tenant_id: tenantId,
        action: 'security_event' as const,
        resource_type: 'security',
        resource_id: null,
        after_state: {
          event,
          details,
          ip_address: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip'),
          user_agent: req?.headers.get('user-agent'),
          timestamp: new Date().toISOString()
        },
        user_id: userId,
        compliance_category: 'security'
      }

      // In production, this would use the audit log service
      console.warn('Security Event:', eventData)
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }

  /**
   * Validate IP restrictions for tenant
   */
  static async validateIPRestrictions(
    tenantId: string,
    clientIP: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: tenant } = await tenantService.getTenant(tenantId)
      if (!tenant) {
        return { allowed: false, reason: 'Tenant not found' }
      }

      const settings = tenant.settings as any || {}
      const ipRestrictions = settings.ip_restrictions || []

      if (ipRestrictions.length === 0) {
        return { allowed: true }
      }

      // Check if client IP is in allowed list
      const isAllowed = ipRestrictions.some((restriction: any) => {
        if (restriction.type === 'single') {
          return clientIP === restriction.ip
        } else if (restriction.type === 'range') {
          // Simple range check (would need proper CIDR validation in production)
          return clientIP.startsWith(restriction.prefix)
        }
        return false
      })

      return {
        allowed: isAllowed,
        reason: isAllowed ? undefined : 'IP address not in allowed list'
      }
    } catch (error) {
      console.error('Error validating IP restrictions:', error)
      return { allowed: true } // Allow by default on error
    }
  }

  /**
   * Check session limits for tenant
   */
  static async validateSessionLimits(
    tenantId: string,
    _userId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: tenant } = await tenantService.getTenant(tenantId)
      if (!tenant) {
        return { allowed: false, reason: 'Tenant not found' }
      }

      const settings = tenant.settings as any || {}
      const _maxSessions = settings.max_concurrent_sessions || 5

      // In production, this would check active sessions from Redis/database
      // For now, return allowed
      return { allowed: true }
    } catch (error) {
      console.error('Error validating session limits:', error)
      return { allowed: true }
    }
  }
}

// =====================================================
// MIDDLEWARE DECORATORS
// =====================================================

/**
 * Decorator to ensure tenant context is available
 */
export function withTenantContext<T extends any[]>(
  handler: (context: TenantContext, ...args: T) => Promise<any>
) {
  return async (req: NextRequest, ...args: T) => {
    const context = TenantContextManager.getTenantContextFromHeaders(req)
    
    if (!context) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 401 }
      )
    }

    try {
      await TenantContextManager.setDatabaseContext(context)
      return await handler(context, ...args)
    } finally {
      await TenantContextManager.clearDatabaseContext()
    }
  }
}

/**
 * Decorator to enforce role-based access
 */
export function withRole(requiredRole: string | string[]) {
  return function<T extends any[]>(
    handler: (context: TenantContext, ...args: T) => Promise<any>
  ) {
    return withTenantContext(async (context: TenantContext, ...args: T) => {
      const validation = await TenantContextManager.validateTenantContext(
        context,
        requiredRole
      )

      if (!validation.valid) {
        await TenantSecurityManager.logSecurityEvent(
          context.tenantId,
          context.userId,
          'unauthorized_access_attempt',
          { requiredRole, userRole: context.role, error: validation.error },
          args[0] as NextRequest
        )

        return NextResponse.json(
          { error: validation.error || 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return await handler(context, ...args)
    })
  }
}

/**
 * Decorator to enforce feature access
 */
export function withFeature(requiredFeature: string) {
  return function<T extends any[]>(
    handler: (context: TenantContext, ...args: T) => Promise<any>
  ) {
    return withTenantContext(async (context: TenantContext, ...args: T) => {
      const featureCheck = await TenantFeatureManager.checkFeatureAccess(
        context.tenantId,
        requiredFeature
      )

      if (!featureCheck.allowed) {
        return NextResponse.json(
          { error: featureCheck.reason || 'Feature not available' },
          { status: 403 }
        )
      }

      return await handler(context, ...args)
    })
  }
}

/**
 * Decorator to enforce usage limits
 */
export function withUsageLimit(action: 'create_asset' | 'create_user' | 'upload_file') {
  return function<T extends any[]>(
    handler: (context: TenantContext, ...args: T) => Promise<any>
  ) {
    return withTenantContext(async (context: TenantContext, ...args: T) => {
      const limitCheck = await TenantFeatureManager.checkActionLimit(
        context.tenantId,
        action
      )

      if (!limitCheck.allowed) {
        return NextResponse.json(
          { error: limitCheck.reason || 'Usage limit exceeded' },
          { status: 429 }
        )
      }

      return await handler(context, ...args)
    })
  }
}