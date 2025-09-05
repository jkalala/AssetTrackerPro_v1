// =====================================================
// ROLE VALIDATION MIDDLEWARE
// =====================================================
// Middleware for validating user roles and permissions on API endpoints

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PermissionService } from '@/lib/services/permission-service'
import { PermissionCheckRequest } from '@/lib/types/rbac'

export interface RoleValidationOptions {
  requiredPermissions?: string[]
  requireAllPermissions?: boolean // true = AND, false = OR
  resourceIdExtractor?: (req: NextRequest) => string | undefined
  contextExtractor?: (req: NextRequest) => Record<string, any>
  onUnauthorized?: (req: NextRequest, reason: string) => NextResponse
  skipValidation?: (req: NextRequest) => boolean
}

export class RoleValidationMiddleware {
  private permissionService = new PermissionService()

  /**
   * Creates a middleware function that validates user permissions
   */
  createValidator(options: RoleValidationOptions = {}) {
    return async (req: NextRequest): Promise<NextResponse | null> => {
      try {
        // Skip validation if specified
        if (options.skipValidation?.(req)) {
          return null
        }

        // Get user context from request
        const userContext = await this.extractUserContext(req)
        if (!userContext) {
          return this.handleUnauthorized(req, 'User not authenticated', options)
        }

        // Skip if no permissions required
        if (!options.requiredPermissions || options.requiredPermissions.length === 0) {
          return null
        }

        // Extract resource ID and context
        const resourceId = options.resourceIdExtractor?.(req)
        const context = {
          ...options.contextExtractor?.(req),
          endpoint: req.nextUrl.pathname,
          method: req.method,
          ip_address: this.getClientIP(req),
          user_agent: req.headers.get('user-agent') || undefined,
          session_id: userContext.sessionId,
        }

        // Check permissions
        const permissionChecks: PermissionCheckRequest[] = options.requiredPermissions.map(
          permission => ({
            permission_name: permission,
            resource_id: resourceId,
            context,
          })
        )

        const results = await this.permissionService.checkMultiplePermissions(
          userContext.tenantId,
          userContext.userId,
          permissionChecks
        )

        // Evaluate results based on requireAllPermissions setting
        const hasRequiredPermissions =
          options.requireAllPermissions !== false
            ? options.requiredPermissions.every(permission => results[permission]?.granted)
            : options.requiredPermissions.some(permission => results[permission]?.granted)

        if (!hasRequiredPermissions) {
          const deniedPermissions = options.requiredPermissions.filter(
            permission => !results[permission]?.granted
          )
          const reason = `Missing required permissions: ${deniedPermissions.join(', ')}`
          return this.handleUnauthorized(req, reason, options)
        }

        // Add permission context to request headers for downstream use
        const permissionContext = {
          userId: userContext.userId,
          tenantId: userContext.tenantId,
          grantedPermissions: Object.entries(results)
            .filter(([, result]) => result.granted)
            .map(([permission]) => permission),
          resourceId,
          context,
        }

        // Store in request headers (will be available in API routes)
        const response = NextResponse.next()
        response.headers.set('x-permission-context', JSON.stringify(permissionContext))

        return response
      } catch (error) {
        console.error('Error in role validation middleware:', error)
        return this.handleUnauthorized(req, 'Permission validation failed', options)
      }
    }
  }

  /**
   * Validates permissions for API route handlers
   */
  async validateApiRoute(
    req: NextRequest,
    requiredPermissions: string[],
    options: Omit<RoleValidationOptions, 'requiredPermissions'> = {}
  ): Promise<{
    valid: boolean
    userContext?: UserContext
    reason?: string
    permissionResults?: Record<string, any>
  }> {
    try {
      const userContext = await this.extractUserContext(req)
      if (!userContext) {
        return { valid: false, reason: 'User not authenticated' }
      }

      if (requiredPermissions.length === 0) {
        return { valid: true, userContext }
      }

      const resourceId = options.resourceIdExtractor?.(req)
      const context = {
        ...options.contextExtractor?.(req),
        endpoint: req.nextUrl.pathname,
        method: req.method,
        ip_address: this.getClientIP(req),
        user_agent: req.headers.get('user-agent') || undefined,
        session_id: userContext.sessionId,
      }

      const permissionChecks: PermissionCheckRequest[] = requiredPermissions.map(permission => ({
        permission_name: permission,
        resource_id: resourceId,
        context,
      }))

      const results = await this.permissionService.checkMultiplePermissions(
        userContext.tenantId,
        userContext.userId,
        permissionChecks
      )

      const hasRequiredPermissions =
        options.requireAllPermissions !== false
          ? requiredPermissions.every(permission => results[permission]?.granted)
          : requiredPermissions.some(permission => results[permission]?.granted)

      if (!hasRequiredPermissions) {
        const deniedPermissions = requiredPermissions.filter(
          permission => !results[permission]?.granted
        )
        return {
          valid: false,
          userContext,
          reason: `Missing required permissions: ${deniedPermissions.join(', ')}`,
          permissionResults: results,
        }
      }

      return {
        valid: true,
        userContext,
        permissionResults: results,
      }
    } catch (error) {
      console.error('Error validating API route:', error)
      return { valid: false, reason: 'Permission validation failed' }
    }
  }

  /**
   * Higher-order function to wrap API route handlers with permission validation
   */
  withPermissions(
    requiredPermissions: string[],
    options: Omit<RoleValidationOptions, 'requiredPermissions'> = {}
  ) {
    return function <T extends any[]>(
      handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
    ) {
      return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
        const validation = await new RoleValidationMiddleware().validateApiRoute(
          req,
          requiredPermissions,
          options
        )

        if (!validation.valid) {
          return NextResponse.json({ error: validation.reason || 'Unauthorized' }, { status: 403 })
        }

        // Add user context to request for handler use
        ;(req as any).userContext = validation.userContext
        ;(req as any).permissionResults = validation.permissionResults

        return handler(req, ...args)
      }
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private async extractUserContext(req: NextRequest): Promise<UserContext | null> {
    try {
      const supabase = await createClient()

      // Get user from Supabase auth
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) {
        return null
      }

      // Get user profile with tenant information
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role, department')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return null
      }

      // Extract session ID from request headers or generate one
      const sessionId =
        req.headers.get('x-session-id') ||
        req.headers.get('authorization')?.split(' ')[1]?.slice(-8) ||
        'unknown'

      return {
        userId: user.id,
        tenantId: profile.tenant_id,
        role: profile.role,
        department: profile.department,
        sessionId,
        email: user.email || '',
      }
    } catch (error) {
      console.error('Error extracting user context:', error)
      return null
    }
  }

  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIP = req.headers.get('x-real-ip')
    const cfConnectingIP = req.headers.get('cf-connecting-ip')

    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    return realIP || cfConnectingIP || 'unknown'
  }

  private handleUnauthorized(
    req: NextRequest,
    reason: string,
    options: RoleValidationOptions
  ): NextResponse {
    if (options.onUnauthorized) {
      return options.onUnauthorized(req, reason)
    }

    // Default unauthorized response
    return NextResponse.json({ error: reason }, { status: 403 })
  }
}

// =====================================================
// HELPER TYPES
// =====================================================

interface UserContext {
  userId: string
  tenantId: string
  role: string
  department?: string
  sessionId: string
  email: string
}

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

/**
 * Creates a permission validator middleware
 */
export function requirePermissions(
  permissions: string[],
  options: Omit<RoleValidationOptions, 'requiredPermissions'> = {}
) {
  const middleware = new RoleValidationMiddleware()
  return middleware.createValidator({
    ...options,
    requiredPermissions: permissions,
  })
}

/**
 * Validates permissions in API route handlers
 */
export async function validatePermissions(
  req: NextRequest,
  permissions: string[],
  options: Omit<RoleValidationOptions, 'requiredPermissions'> = {}
) {
  const middleware = new RoleValidationMiddleware()
  return middleware.validateApiRoute(req, permissions, options)
}

/**
 * Higher-order function to wrap API handlers with permission validation
 */
export function withPermissions(
  permissions: string[],
  options: Omit<RoleValidationOptions, 'requiredPermissions'> = {}
) {
  const middleware = new RoleValidationMiddleware()
  return middleware.withPermissions(permissions, options)
}

// =====================================================
// COMMON PERMISSION EXTRACTORS
// =====================================================

/**
 * Extracts asset ID from URL path
 */
export function extractAssetId(req: NextRequest): string | undefined {
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const assetIndex = pathParts.findIndex(part => part === 'assets')
  return assetIndex !== -1 && pathParts[assetIndex + 1] ? pathParts[assetIndex + 1] : undefined
}

/**
 * Extracts user ID from URL path
 */
export function extractUserId(req: NextRequest): string | undefined {
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const userIndex = pathParts.findIndex(part => part === 'users')
  return userIndex !== -1 && pathParts[userIndex + 1] ? pathParts[userIndex + 1] : undefined
}

/**
 * Extracts department ID from URL path
 */
export function extractDepartmentId(req: NextRequest): string | undefined {
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const deptIndex = pathParts.findIndex(part => part === 'departments')
  return deptIndex !== -1 && pathParts[deptIndex + 1] ? pathParts[deptIndex + 1] : undefined
}

/**
 * Creates context with common request information
 */
export function createRequestContext(req: NextRequest): Record<string, any> {
  return {
    endpoint: req.nextUrl.pathname,
    method: req.method,
    query_params: Object.fromEntries(req.nextUrl.searchParams),
    timestamp: new Date().toISOString(),
  }
}

// =====================================================
// PERMISSION CONSTANTS
// =====================================================

export const PERMISSIONS = {
  // Asset permissions
  ASSETS: {
    CREATE: 'create:asset',
    READ: 'read:asset',
    UPDATE: 'update:asset',
    DELETE: 'delete:asset',
    ASSIGN: 'assign:asset',
    TRANSFER: 'transfer:asset',
    MANAGE: 'manage:asset',
  },

  // User permissions
  USERS: {
    CREATE: 'create:user',
    READ: 'read:user',
    UPDATE: 'update:user',
    DELETE: 'delete:user',
    MANAGE: 'manage:user',
  },

  // Role permissions
  ROLES: {
    CREATE: 'create:role',
    READ: 'read:role',
    UPDATE: 'update:role',
    DELETE: 'delete:role',
    MANAGE: 'manage:role',
  },

  // Department permissions
  DEPARTMENTS: {
    CREATE: 'create:department',
    READ: 'read:department',
    UPDATE: 'update:department',
    DELETE: 'delete:department',
    MANAGE: 'manage:department',
  },

  // Report permissions
  REPORTS: {
    CREATE: 'create:report',
    READ: 'read:report',
    UPDATE: 'update:report',
    DELETE: 'delete:report',
    EXPORT: 'export:report',
  },

  // Setting permissions
  SETTINGS: {
    READ: 'read:setting',
    UPDATE: 'update:setting',
    MANAGE: 'manage:setting',
  },

  // Audit permissions
  AUDIT: {
    READ: 'read:audit',
    EXPORT: 'export:audit',
  },
} as const
