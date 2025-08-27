// =====================================================
// ROW LEVEL SECURITY UTILITIES
// =====================================================
// Utilities for managing Row Level Security and tenant isolation

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { TenantContext } from '@/lib/types/database'

export class RLSManager {
  private async getSupabase() {
    return createClient()
  }

  // =====================================================
  // CONTEXT MANAGEMENT
  // =====================================================

  /**
   * Get tenant context from request headers (set by middleware)
   */
  async getTenantContextFromHeaders(): Promise<TenantContext | null> {
    try {
      const headersList = await headers()
      
      const tenantId = headersList.get('x-tenant-id')
      const userId = headersList.get('x-user-id')
      const role = headersList.get('x-user-role')
      
      if (!tenantId || !userId || !role) {
        return null
      }

      return {
        tenantId,
        userId,
        role: role as any,
        permissions: {} // Will be loaded separately if needed
      }
    } catch (error) {
      console.error('Error getting tenant context from headers:', error)
      return null
    }
  }

  /**
   * Set RLS context for database operations
   */
  async setRLSContext(context: TenantContext): Promise<void> {
    try {
      // Set session variables for RLS policies
      const supabase = await this.getSupabase()
      await supabase.rpc('set_current_user_context', {
        user_id: context.userId,
        tenant_id: context.tenantId
      })
    } catch (error) {
      console.error('Error setting RLS context:', error)
      throw new Error('Failed to set security context')
    }
  }

  /**
   * Clear RLS context
   */
  async clearRLSContext(): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase.rpc('clear_user_context')
    } catch (error) {
      console.error('Error clearing RLS context:', error)
    }
  }

  // =====================================================
  // TENANT VALIDATION
  // =====================================================

  /**
   * Validate that user has access to specific tenant
   */
  async validateTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase.rpc('check_tenant_access', {
        target_tenant_id: tenantId
      })

      if (error) {
        console.error('Error validating tenant access:', error)
        return false
      }

      return data === true
    } catch (error) {
      console.error('Error in tenant access validation:', error)
      return false
    }
  }

  /**
   * Validate asset access for current user
   */
  async validateAssetAccess(assetId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase.rpc('can_access_asset', {
        asset_id: assetId
      })

      if (error) {
        console.error('Error validating asset access:', error)
        return false
      }

      return data === true
    } catch (error) {
      console.error('Error in asset access validation:', error)
      return false
    }
  }

  // =====================================================
  // ROLE-BASED ACCESS CONTROL
  // =====================================================

  /**
   * Check if current user has specific role
   */
  async hasRole(requiredRole: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase.rpc('has_role', {
        required_role: requiredRole
      })

      if (error) {
        console.error('Error checking role:', error)
        return false
      }

      return data === true
    } catch (error) {
      console.error('Error in role check:', error)
      return false
    }
  }

  /**
   * Check if current user has any of the specified roles
   */
  async hasAnyRole(requiredRoles: string[]): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase.rpc('has_any_role', {
        required_roles: requiredRoles
      })

      if (error) {
        console.error('Error checking roles:', error)
        return false
      }

      return data === true
    } catch (error) {
      console.error('Error in roles check:', error)
      return false
    }
  }

  /**
   * Check if current user is tenant owner
   */
  async isTenantOwner(): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase.rpc('is_tenant_owner')

      if (error) {
        console.error('Error checking tenant owner:', error)
        return false
      }

      return data === true
    } catch (error) {
      console.error('Error in tenant owner check:', error)
      return false
    }
  }

  // =====================================================
  // SECURE QUERY BUILDERS
  // =====================================================

  /**
   * Create a tenant-scoped query builder
   */
  async createTenantQuery<T>(tableName: string) {
    const supabase = await this.getSupabase()
    return supabase.from(tableName) as any
  }

  /**
   * Create a query with automatic tenant filtering
   */
  async createSecureQuery<T>(tableName: string, tenantId?: string) {
    // If tenantId is provided, validate access
    if (tenantId) {
      const context = await this.getTenantContextFromHeaders()
      if (!context || context.tenantId !== tenantId) {
        throw new Error('Unauthorized tenant access')
      }
    }

    const supabase = await this.getSupabase()
    return supabase.from(tableName) as any
  }

  // =====================================================
  // AUDIT LOGGING
  // =====================================================

  /**
   * Log security event
   */
  async logSecurityEvent(
    event: string,
    details: Record<string, any>,
    severity: 'info' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    try {
      const context = await this.getTenantContextFromHeaders()
      
      const supabase = await this.getSupabase()
      await supabase.from('audit_logs').insert({
        tenant_id: context?.tenantId,
        action: 'security_event',
        resource_type: 'security',
        resource_id: null,
        after_state: {
          event,
          details,
          severity,
          timestamp: new Date().toISOString()
        },
        user_id: context?.userId,
        compliance_category: 'security'
      })
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }

  // =====================================================
  // PERMISSION HELPERS
  // =====================================================

  /**
   * Check if user can perform action on resource
   */
  async canPerformAction(
    action: string,
    resourceType: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      const context = await this.getTenantContextFromHeaders()
      if (!context) return false

      // Define permission matrix
      const permissions = {
        'create': ['owner', 'admin', 'manager', 'user'],
        'read': ['owner', 'admin', 'manager', 'user', 'viewer'],
        'update': ['owner', 'admin', 'manager'],
        'delete': ['owner', 'admin'],
        'manage_users': ['owner', 'admin'],
        'manage_tenant': ['owner'],
        'view_analytics': ['owner', 'admin', 'manager'],
        'manage_integrations': ['owner', 'admin']
      }

      const allowedRoles = permissions[action as keyof typeof permissions]
      if (!allowedRoles) return false

      return allowedRoles.includes(context.role)
    } catch (error) {
      console.error('Error checking action permission:', error)
      return false
    }
  }

  /**
   * Enforce permission check with error throwing
   */
  async enforcePermission(
    action: string,
    resourceType: string,
    resourceId?: string
  ): Promise<void> {
    const hasPermission = await this.canPerformAction(action, resourceType, resourceId)
    
    if (!hasPermission) {
      await this.logSecurityEvent(
        'permission_denied',
        { action, resourceType, resourceId },
        'warning'
      )
      throw new Error(`Permission denied: ${action} on ${resourceType}`)
    }
  }

  // =====================================================
  // DATA SANITIZATION
  // =====================================================

  /**
   * Sanitize data based on user role and permissions
   */
  sanitizeData<T extends Record<string, any>>(
    data: T,
    dataType: string,
    userRole: string
  ): Partial<T> {
    const sensitiveFields = {
      'profile': ['mfa_secret', 'backup_codes', 'failed_login_attempts'],
      'tenant': ['stripe_customer_id', 'stripe_subscription_id'],
      'asset': [], // No sensitive fields for assets currently
      'audit_log': userRole === 'viewer' ? ['ip_address', 'user_agent'] : []
    }

    const fieldsToRemove = sensitiveFields[dataType as keyof typeof sensitiveFields] || []
    
    const sanitized = { ...data }
    fieldsToRemove.forEach(field => {
      delete sanitized[field]
    })

    return sanitized
  }

  // =====================================================
  // RATE LIMITING HELPERS
  // =====================================================

  /**
   * Check rate limit for user action
   */
  async checkRateLimit(
    action: string,
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    // This would integrate with Redis or similar for production
    // For now, return allowed
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: new Date(Date.now() + windowMs)
    }
  }
}

// Export singleton instance
export const rlsManager = new RLSManager()

// =====================================================
// DECORATOR FUNCTIONS FOR API ROUTES
// =====================================================

/**
 * Decorator to enforce tenant context in API routes
 */
export function withTenantContext<T extends any[]>(
  handler: (...args: T) => Promise<Record<string, unknown>>
) {
  return async (...args: T) => {
    const context = await rlsManager.getTenantContextFromHeaders()
    
    if (!context) {
      throw new Error('Tenant context required')
    }

    await rlsManager.setRLSContext(context)
    
    try {
      return await handler(...args)
    } finally {
      await rlsManager.clearRLSContext()
    }
  }
}

/**
 * Decorator to enforce specific role in API routes
 */
export function withRole(requiredRole: string | string[]) {
  return function<T extends any[]>(
    handler: (...args: T) => Promise<Record<string, unknown>>
  ) {
    return async (...args: T) => {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      const hasPermission = await rlsManager.hasAnyRole(roles)
      
      if (!hasPermission) {
        await rlsManager.logSecurityEvent(
          'unauthorized_access_attempt',
          { requiredRole, endpoint: 'api' },
          'warning'
        )
        throw new Error('Insufficient permissions')
      }

      return await handler(...args)
    }
  }
}

/**
 * Decorator to enforce asset access in API routes
 */
export function withAssetAccess(assetIdParam: string = 'assetId') {
  return function<T extends any[]>(
    handler: (...args: T) => Promise<Record<string, unknown>>
  ) {
    return async (...args: T) => {
      // Extract asset ID from request parameters
      // This would need to be adapted based on your API structure
      const assetId = (args[0] as any)?.params?.[assetIdParam]
      
      if (assetId) {
        const hasAccess = await rlsManager.validateAssetAccess(assetId)
        if (!hasAccess) {
          throw new Error('Asset access denied')
        }
      }

      return await handler(...args)
    }
  }
}