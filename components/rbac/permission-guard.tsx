'use client'

// =====================================================
// PERMISSION GUARD COMPONENT
// =====================================================
// Component for protecting UI elements based on user permissions

import { ReactNode, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PermissionService } from '@/lib/services/permission-service'
import { PermissionCheckRequest } from '@/lib/types/rbac'

interface PermissionGuardProps {
  children: ReactNode
  permissions: string | string[]
  requireAll?: boolean // true = AND, false = OR (default)
  resourceId?: string
  context?: Record<string, unknown>
  fallback?: ReactNode
  loading?: ReactNode
  onUnauthorized?: () => void
  tenantId?: string
  userId?: string
}

export function PermissionGuard({
  children,
  permissions,
  requireAll = false,
  resourceId,
  context,
  fallback = null,
  loading = null,
  onUnauthorized,
  tenantId,
  userId
}: PermissionGuardProps): React.ReactElement {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userContext, setUserContext] = useState<{ tenantId: string; userId: string } | null>(null)

  const permissionService = new PermissionService()

  const loadUserContext = useCallback(async () => {
    if (tenantId && userId) {
      setUserContext({ tenantId, userId })
      return
    }

    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      
      if (data.user && data.tenant) {
        setUserContext({
          tenantId: data.tenant.id,
          userId: data.user.id
        })
      }
    } catch (error) {
      console.error('Failed to load user context:', error)
    }
  }, [tenantId, userId])

  const checkPermissions = useCallback(async () => {
    if (!userContext && !(tenantId && userId)) {
      setHasPermission(false)
      setIsLoading(false)
      return
    }

    const currentTenantId = tenantId || userContext?.tenantId
    const currentUserId = userId || userContext?.userId

    if (!currentTenantId || !currentUserId) {
      setHasPermission(false)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
      const results = await Promise.all(
        permissionArray.map(permission =>
          permissionService.checkPermission(
            currentUserId,
            resourceId || 'default',
            permission
          )
        )
      )

      const hasAccess = requireAll 
        ? results.every(result => result)
        : results.some(result => result)

      setHasPermission(hasAccess)
      
      if (!hasAccess && onUnauthorized) {
        onUnauthorized()
      }
    } catch (error) {
      console.error('Permission check failed:', error)
      setHasPermission(false)
    } finally {
      setIsLoading(false)
    }
  }, [userContext, permissions, resourceId, context, tenantId, userId, requireAll, onUnauthorized, permissionService])

  useEffect(() => {
    loadUserContext()
  }, [loadUserContext])

  useEffect(() => {
    if (userContext || (tenantId && userId)) {
      checkPermissions()
    }
  }, [userContext, tenantId, userId, checkPermissions])

  if (isLoading) {
    return loading || <div className="animate-pulse bg-gray-200 rounded h-4 w-16"></div>
  }

  if (hasPermission === false) {
    return <>{fallback}</>
  }

  if (hasPermission === true) {
    return <>{children}</>
  }

  return <></>
}

// =====================================================
// HOOK FOR PERMISSION CHECKING
// =====================================================

export function usePermissions(
  permissions: string | string[],
  options: {
    requireAll?: boolean
    resourceId?: string
    context?: Record<string, unknown>
    tenantId?: string
    userId?: string
  } = {}
) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userContext, setUserContext] = useState<{ tenantId: string; userId: string } | null>(null)

  const permissionService = new PermissionService()

  const loadUserContext = useCallback(async () => {
    if (options.tenantId && options.userId) {
      setUserContext({ tenantId: options.tenantId, userId: options.userId })
      return
    }

    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        setHasPermission(false)
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setHasPermission(false)
        setIsLoading(false)
        return
      }

      setUserContext({
        tenantId: profile.tenant_id,
        userId: user.id
      })
    } catch (error) {
      console.error('Error loading user context:', error)
      setHasPermission(false)
      setIsLoading(false)
    }
  }, [options.tenantId, options.userId])

  const checkPermissions = useCallback(async () => {
    if (!userContext && !(options.tenantId && options.userId)) {
      setHasPermission(false)
      setIsLoading(false)
      return
    }

    const currentTenantId = options.tenantId || userContext!.tenantId
    const currentUserId = options.userId || userContext!.userId

    try {
      setIsLoading(true)

      const permissionList = Array.isArray(permissions) ? permissions : [permissions]
      
      if (permissionList.length === 0) {
        setHasPermission(true)
        setIsLoading(false)
        return
      }

      const requests: PermissionCheckRequest[] = permissionList.map(permission => ({
        permission_name: permission,
        resource_id: options.resourceId,
        context: {
          ...options.context,
          hook: 'usePermissions',
          timestamp: new Date().toISOString()
        }
      }))

      const results = await permissionService.checkMultiplePermissions(
        currentTenantId,
        currentUserId,
        requests
      )

      const hasRequiredPermissions = options.requireAll
        ? permissionList.every(permission => results[permission]?.granted)
        : permissionList.some(permission => results[permission]?.granted)

      setHasPermission(hasRequiredPermissions)
    } catch (error) {
      console.error('Error checking permissions:', error)
      setHasPermission(false)
    } finally {
      setIsLoading(false)
    }
  }, [userContext, permissions, options, permissionService])

  useEffect(() => {
    loadUserContext()
  }, [loadUserContext])

  useEffect(() => {
    if (userContext || (options.tenantId && options.userId)) {
      checkPermissions()
    }
  }, [userContext, options.tenantId, options.userId, checkPermissions])

  const refetch = () => {
    checkPermissions()
  }

  return {
    hasPermission,
    isLoading,
    refetch
  }
}

// =====================================================
// HIGHER-ORDER COMPONENT FOR PERMISSION PROTECTION
// =====================================================

export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  permissions: string | string[],
  options: {
    requireAll?: boolean
    fallback?: ReactNode
    loading?: ReactNode
  } = {}
) {
  return function PermissionProtectedComponent(props: P) {
    return (
      <PermissionGuard
        permissions={permissions}
        requireAll={options.requireAll}
        fallback={options.fallback}
        loading={options.loading}
      >
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

// =====================================================
// CONDITIONAL RENDERING HELPERS
// =====================================================

interface ConditionalRenderProps {
  children: ReactNode
  condition: boolean
  fallback?: ReactNode
}

export function ConditionalRender({ children, condition, fallback = null }: ConditionalRenderProps) {
  return condition ? <>{children}</> : <>{fallback}</>
}

// =====================================================
// PERMISSION-BASED BUTTON COMPONENT
// =====================================================

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permissions: string | string[]
  requireAll?: boolean
  resourceId?: string
  context?: Record<string, unknown>
  fallback?: ReactNode
  children: ReactNode
  className?: string
}

export function PermissionButton({
  permissions,
  requireAll = false,
  resourceId,
  context,
  fallback = null,
  children,
  className = '',
  ...buttonProps
}: PermissionButtonProps) {
  const { hasPermission, isLoading } = usePermissions(permissions, {
    requireAll,
    resourceId,
    context
  })

  if (isLoading) {
    return (
      <button 
        {...buttonProps} 
        disabled 
        className={`${className} opacity-50 cursor-not-allowed`}
      >
        <div className="animate-pulse">Loading...</div>
      </button>
    )
  }

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return (
    <button {...buttonProps} className={className}>
      {children}
    </button>
  )
}

// =====================================================
// PERMISSION-BASED LINK COMPONENT
// =====================================================

interface PermissionLinkProps {
  permissions: string | string[]
  requireAll?: boolean
  resourceId?: string
  context?: Record<string, unknown>
  fallback?: ReactNode
  children: ReactNode
  href: string
  className?: string
}

export function PermissionLink({
  permissions,
  requireAll = false,
  resourceId,
  context,
  fallback = null,
  children,
  href,
  className = ''
}: PermissionLinkProps) {
  const { hasPermission, isLoading } = usePermissions(permissions, {
    requireAll,
    resourceId,
    context
  })

  if (isLoading) {
    return (
      <span className={`${className} opacity-50`}>
        <div className="animate-pulse">Loading...</div>
      </span>
    )
  }

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

// =====================================================
// PERMISSION CONSTANTS FOR EASY REFERENCE
// =====================================================

export const PERMISSIONS = {
  ASSETS: {
    CREATE: 'create:asset',
    READ: 'read:asset',
    UPDATE: 'update:asset',
    DELETE: 'delete:asset',
    ASSIGN: 'assign:asset',
    TRANSFER: 'transfer:asset',
    MANAGE: 'manage:asset'
  },
  USERS: {
    CREATE: 'create:user',
    READ: 'read:user',
    UPDATE: 'update:user',
    DELETE: 'delete:user',
    MANAGE: 'manage:user'
  },
  ROLES: {
    CREATE: 'create:role',
    READ: 'read:role',
    UPDATE: 'update:role',
    DELETE: 'delete:role',
    MANAGE: 'manage:role'
  },
  DEPARTMENTS: {
    CREATE: 'create:department',
    READ: 'read:department',
    UPDATE: 'update:department',
    DELETE: 'delete:department',
    MANAGE: 'manage:department'
  },
  REPORTS: {
    CREATE: 'create:report',
    READ: 'read:report',
    UPDATE: 'update:report',
    DELETE: 'delete:report',
    EXPORT: 'export:report'
  },
  SETTINGS: {
    READ: 'read:setting',
    UPDATE: 'update:setting',
    MANAGE: 'manage:setting'
  },
  AUDIT: {
    READ: 'read:audit',
    EXPORT: 'export:audit'
  }
} as const