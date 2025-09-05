// =====================================================
// TENANT ISOLATION MIDDLEWARE
// =====================================================
// Middleware utilities for enforcing tenant isolation in API routes

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { TenantContext } from '@/lib/types/database'

export class TenantIsolationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403
  ) {
    super(message)
    this.name = 'TenantIsolationError'
  }
}

export class TenantIsolationManager {
  /**
   * Get tenant context from request headers (set by middleware)
   */
  static async getTenantContext(): Promise<TenantContext | null> {
    try {
      const headersList = await headers()

      const tenantId = headersList.get('x-tenant-id')
      const userId = headersList.get('x-user-id')
      const role = headersList.get('x-user-role')
      const permissions = headersList.get('x-user-permissions')

      if (!tenantId || !userId || !role) {
        return null
      }

      return {
        tenantId,
        userId,
        role: role as any,
        permissions: permissions ? JSON.parse(permissions) : {},
      }
    } catch (error) {
      console.error('Error getting tenant context:', error)
      return null
    }
  }

  /**
   * Validate tenant access and throw error if unauthorized
   */
  static async validateTenantAccess(requiredTenantId?: string): Promise<TenantContext> {
    const context = await this.getTenantContext()

    if (!context) {
      throw new TenantIsolationError('Tenant context required', 401)
    }

    // If a specific tenant ID is required, validate access
    if (requiredTenantId && context.tenantId !== requiredTenantId) {
      throw new TenantIsolationError('Unauthorized access to tenant data', 403)
    }

    return context
  }

  /**
   * Create tenant-scoped Supabase query
   */
  static async createTenantQuery(tableName: string, context?: TenantContext) {
    const tenantContext = context || (await this.getTenantContext())

    if (!tenantContext) {
      throw new TenantIsolationError('Tenant context required for database operations', 401)
    }

    const supabase = await createClient()

    // Set RLS context
    await supabase.rpc('set_current_user_context', {
      user_id: tenantContext.userId,
      tenant_id: tenantContext.tenantId,
    })

    return supabase.from(tableName)
  }

  /**
   * Validate resource belongs to current tenant
   */
  static async validateResourceAccess(
    tableName: string,
    resourceId: string,
    tenantIdColumn: string = 'tenant_id'
  ): Promise<void> {
    const context = await this.getTenantContext()

    if (!context) {
      throw new TenantIsolationError('Tenant context required', 401)
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from(tableName)
      .select(tenantIdColumn)
      .eq('id', resourceId)
      .single()

    if (error) {
      throw new TenantIsolationError('Resource not found', 404)
    }

    if ((data as any)[tenantIdColumn] !== context.tenantId) {
      throw new TenantIsolationError('Unauthorized access to resource', 403)
    }
  }

  /**
   * Filter data to only include current tenant's resources
   */
  static async filterTenantData<T extends Record<string, any>>(
    data: T[],
    tenantIdField: string = 'tenant_id'
  ): Promise<T[]> {
    const context = await this.getTenantContext()

    if (!context) {
      return []
    }

    return data.filter(item => item[tenantIdField] === context.tenantId)
  }

  /**
   * Add tenant ID to data being created
   */
  static async addTenantContext<T extends Record<string, any>>(
    data: T,
    tenantIdField: string = 'tenant_id'
  ): Promise<T & { [key: string]: string }> {
    const context = await this.getTenantContext()

    if (!context) {
      throw new TenantIsolationError('Tenant context required for data creation', 401)
    }

    return {
      ...data,
      [tenantIdField]: context.tenantId,
    }
  }

  /**
   * Validate user has required role within tenant
   */
  static async validateRole(requiredRoles: string | string[]): Promise<void> {
    const context = await this.getTenantContext()

    if (!context) {
      throw new TenantIsolationError('Authentication required', 401)
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

    // Owner and admin roles have elevated access
    if (['owner', 'admin'].includes(context.role)) {
      return
    }

    if (!roles.includes(context.role)) {
      throw new TenantIsolationError(
        `Insufficient permissions. Required: ${roles.join(' or ')}`,
        403
      )
    }
  }

  /**
   * Log security event for tenant isolation violations
   */
  static async logSecurityEvent(
    event: string,
    details: Record<string, any>,
    req?: NextRequest
  ): Promise<void> {
    try {
      const context = await this.getTenantContext()
      const supabase = await createClient()

      await supabase.from('audit_logs').insert({
        tenant_id: context?.tenantId,
        action: 'security_event',
        resource_type: 'security',
        resource_id: null,
        after_state: {
          event,
          details,
          ip_address: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip'),
          user_agent: req?.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        },
        user_id: context?.userId,
        compliance_category: 'security',
      })
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }
}

/**
 * Decorator function to wrap API handlers with tenant isolation
 */
export function withTenantIsolation<T extends any[]>(
  handler: (context: TenantContext, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const context = await TenantIsolationManager.validateTenantAccess()
      return await handler(context, ...args)
    } catch (error) {
      if (error instanceof TenantIsolationError) {
        await TenantIsolationManager.logSecurityEvent(
          'tenant_isolation_violation',
          { error: error.message },
          args[0] as NextRequest
        )

        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }

      console.error('Unexpected error in tenant isolation:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Decorator function to enforce role-based access with tenant isolation
 */
export function withTenantRole(requiredRoles: string | string[]) {
  return function <T extends any[]>(
    handler: (context: TenantContext, ...args: T) => Promise<Response>
  ) {
    return withTenantIsolation(async (context: TenantContext, ...args: T) => {
      await TenantIsolationManager.validateRole(requiredRoles)
      return await handler(context, ...args)
    })
  }
}

/**
 * Decorator function to validate resource access with tenant isolation
 */
export function withResourceAccess(
  tableName: string,
  resourceIdParam: string = 'id',
  tenantIdColumn: string = 'tenant_id'
) {
  return function <T extends any[]>(
    handler: (context: TenantContext, ...args: T) => Promise<Response>
  ) {
    return withTenantIsolation(async (context: TenantContext, ...args: T) => {
      // Extract resource ID from request parameters
      const request = args[0] as NextRequest
      const url = new URL(request.url)
      const resourceId =
        url.searchParams.get(resourceIdParam) || (args[1] as any)?.params?.[resourceIdParam]

      if (resourceId) {
        await TenantIsolationManager.validateResourceAccess(tableName, resourceId, tenantIdColumn)
      }

      return await handler(context, ...args)
    })
  }
}

/**
 * Helper function to create standardized error responses
 */
export function createTenantErrorResponse(
  message: string,
  statusCode: number = 403,
  details?: Record<string, any>
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: 'TENANT_ISOLATION_ERROR',
      details,
    },
    { status: statusCode }
  )
}

/**
 * Helper function to create tenant-aware success responses
 */
export function createTenantResponse<T>(
  data: T,
  context: TenantContext,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status })

  // Add tenant context headers for debugging
  response.headers.set('x-response-tenant-id', context.tenantId)
  response.headers.set('x-response-user-id', context.userId)

  return response
}
