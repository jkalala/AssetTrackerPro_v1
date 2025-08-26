// =====================================================
// PERMISSION SERVICE
// =====================================================
// Service for checking and managing user permissions

import { createClient } from '@/lib/supabase/server'
import { 
  UserPermission,
  PermissionCheckRequest,
  PermissionCheckResponse,
  PermissionUsage,
  PermissionUsageInsert,
  ResourceType,
  PermissionAction,
  PermissionScope
} from '@/lib/types/rbac'
import { Database } from '@/lib/types/database'
import { globalPermissionCache, hashContext } from '@/lib/utils/permission-cache'

export class PermissionService {
  private async getSupabaseClient() {
    return await createClient()
  }

  // =====================================================
  // PERMISSION CHECKING
  // =====================================================

  async checkPermission(
    tenantId: string, 
    userId: string, 
    request: PermissionCheckRequest
  ): Promise<PermissionCheckResponse> {
    const startTime = Date.now()
    const contextHash = hashContext(request.context)
    
    // Check cache first
    const cachedResult = globalPermissionCache.getPermissionCheck(
      tenantId,
      userId,
      request.permission_name,
      request.resource_id,
      contextHash
    )

    if (cachedResult !== null) {
      return {
        granted: cachedResult,
        reason: cachedResult ? undefined : 'Cached denial'
      }
    }
    
    try {
      // Get user permissions (with caching)
      const userPermissions = await this.getUserPermissions(tenantId, userId)
      
      // Find matching permission
      const matchingPermission = userPermissions.find(p => 
        p.permission_name === request.permission_name
      )

      if (!matchingPermission) {
        const result = false
        globalPermissionCache.setPermissionCheck(
          tenantId, userId, request.permission_name, result, request.resource_id, contextHash
        )
        await this.logPermissionUsage(tenantId, userId, request, result, 'Permission not found', Date.now() - startTime)
        return {
          granted: result,
          reason: 'Permission not found'
        }
      }

      // Check resource filters if specified
      if (request.resource_id && matchingPermission.resource_filters) {
        const resourceAllowed = await this.checkResourceFilters(
          matchingPermission.resource_filters,
          request.resource_id,
          request.context
        )
        
        if (!resourceAllowed) {
          const result = false
          globalPermissionCache.setPermissionCheck(
            tenantId, userId, request.permission_name, result, request.resource_id, contextHash
          )
          await this.logPermissionUsage(tenantId, userId, request, result, 'Resource access denied', Date.now() - startTime)
          return {
            granted: result,
            reason: 'Resource access denied'
          }
        }
      }

      // Check conditions if specified
      if (matchingPermission.conditions && Object.keys(matchingPermission.conditions).length > 0) {
        const conditionsMet = await this.checkConditions(
          matchingPermission.conditions,
          request.context,
          tenantId,
          userId
        )
        
        if (!conditionsMet) {
          const result = false
          globalPermissionCache.setPermissionCheck(
            tenantId, userId, request.permission_name, result, request.resource_id, contextHash
          )
          await this.logPermissionUsage(tenantId, userId, request, result, 'Conditions not met', Date.now() - startTime)
          return {
            granted: result,
            reason: 'Conditions not met'
          }
        }
      }

      // Permission granted
      const result = true
      globalPermissionCache.setPermissionCheck(
        tenantId, userId, request.permission_name, result, request.resource_id, contextHash
      )
      await this.logPermissionUsage(tenantId, userId, request, result, null, Date.now() - startTime)
      
      return {
        granted: result,
        source: matchingPermission.source,
        conditions: matchingPermission.conditions
      }
    } catch (error) {
      console.error('Error checking permission:', error)
      const result = false
      globalPermissionCache.setPermissionCheck(
        tenantId, userId, request.permission_name, result, request.resource_id, contextHash
      )
      await this.logPermissionUsage(tenantId, userId, request, result, 'System error', Date.now() - startTime)
      
      return {
        granted: result,
        reason: 'System error'
      }
    }
  }

  async checkMultiplePermissions(
    tenantId: string,
    userId: string,
    requests: PermissionCheckRequest[]
  ): Promise<Record<string, PermissionCheckResponse>> {
    const results: Record<string, PermissionCheckResponse> = {}
    
    // Get user permissions once for all checks
    const userPermissions = await this.getUserPermissions(tenantId, userId)
    
    for (const request of requests) {
      const startTime = Date.now()
      
      try {
        const matchingPermission = userPermissions.find(p => 
          p.permission_name === request.permission_name
        )

        if (!matchingPermission) {
          results[request.permission_name] = {
            granted: false,
            reason: 'Permission not found'
          }
          continue
        }

        // Apply same checks as single permission check
        let granted = true
        let reason: string | undefined

        // Resource filters check
        if (request.resource_id && matchingPermission.resource_filters) {
          const resourceAllowed = await this.checkResourceFilters(
            matchingPermission.resource_filters,
            request.resource_id,
            request.context
          )
          
          if (!resourceAllowed) {
            granted = false
            reason = 'Resource access denied'
          }
        }

        // Conditions check
        if (granted && matchingPermission.conditions && Object.keys(matchingPermission.conditions).length > 0) {
          const conditionsMet = await this.checkConditions(
            matchingPermission.conditions,
            request.context,
            tenantId,
            userId
          )
          
          if (!conditionsMet) {
            granted = false
            reason = 'Conditions not met'
          }
        }

        results[request.permission_name] = {
          granted,
          reason,
          source: granted ? matchingPermission.source : undefined,
          conditions: granted ? matchingPermission.conditions : undefined
        }

        // Log usage
        await this.logPermissionUsage(tenantId, userId, request, granted, reason, Date.now() - startTime)
      } catch (error) {
        console.error(`Error checking permission ${request.permission_name}:`, error)
        results[request.permission_name] = {
          granted: false,
          reason: 'System error'
        }
      }
    }
    
    return results
  }

  async getUserPermissions(tenantId: string, userId: string, useCache = true): Promise<UserPermission[]> {
    // Check cache first
    if (useCache) {
      const cached = globalPermissionCache.getUserPermissions(tenantId, userId)
      if (cached) {
        return cached
      }
    }

    try {
      const supabase = await this.getSupabaseClient()
      
      // Use database function to get all permissions including inherited and delegated
      const { data: permissions, error } = await supabase
        .rpc('get_user_permissions', {
          p_tenant_id: tenantId,
          p_user_id: userId
        })

      if (error) {
        throw new Error(`Failed to get user permissions: ${error.message}`)
      }

      const userPermissions: UserPermission[] = permissions || []

      // Cache the result
      if (useCache) {
        globalPermissionCache.setUserPermissions(tenantId, userId, userPermissions)
      }

      return userPermissions
    } catch (error) {
      console.error('Error getting user permissions:', error)
      throw error
    }
  }

  async hasPermission(
    tenantId: string,
    userId: string,
    permissionName: string,
    resourceId?: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data: hasPermission, error } = await supabase
        .rpc('user_has_permission', {
          p_tenant_id: tenantId,
          p_user_id: userId,
          p_permission_name: permissionName,
          p_resource_id: resourceId || null,
          p_context: context || {}
        })

      if (error) {
        console.error('Error checking permission:', error)
        return false
      }

      return hasPermission || false
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }

  // =====================================================
  // RESOURCE FILTERS AND CONDITIONS
  // =====================================================

  private async checkResourceFilters(
    filters: Record<string, any>,
    resourceId: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Handle different filter types
      if (filters.allowed_resources) {
        return filters.allowed_resources.includes(resourceId)
      }

      if (filters.denied_resources) {
        return !filters.denied_resources.includes(resourceId)
      }

      if (filters.resource_pattern) {
        const pattern = new RegExp(filters.resource_pattern)
        return pattern.test(resourceId)
      }

      if (filters.department_resources && context?.user_department) {
        // Check if resource belongs to user's department
        const supabase = await this.getSupabaseClient()
        const { data: resource } = await supabase
          .from('assets') // Assuming assets table, adjust as needed
          .select('department')
          .eq('id', resourceId)
          .single()

        return resource?.department === context.user_department
      }

      // If no specific filters, allow access
      return true
    } catch (error) {
      console.error('Error checking resource filters:', error)
      return false
    }
  }

  private async checkConditions(
    conditions: Record<string, any>,
    context?: Record<string, any>,
    tenantId?: string,
    userId?: string
  ): Promise<boolean> {
    try {
      // Time-based conditions
      if (conditions.time_restrictions) {
        const now = new Date()
        const currentHour = now.getHours()
        const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.

        if (conditions.time_restrictions.allowed_hours) {
          const [startHour, endHour] = conditions.time_restrictions.allowed_hours
          if (currentHour < startHour || currentHour > endHour) {
            return false
          }
        }

        if (conditions.time_restrictions.allowed_days) {
          if (!conditions.time_restrictions.allowed_days.includes(currentDay)) {
            return false
          }
        }
      }

      // IP-based conditions
      if (conditions.ip_restrictions && context?.ip_address) {
        const allowedIPs = conditions.ip_restrictions.allowed_ips || []
        const deniedIPs = conditions.ip_restrictions.denied_ips || []

        if (allowedIPs.length > 0 && !allowedIPs.includes(context.ip_address)) {
          return false
        }

        if (deniedIPs.includes(context.ip_address)) {
          return false
        }
      }

      // Location-based conditions
      if (conditions.location_restrictions && context?.location) {
        // Implement geofencing logic here
        // This would require PostGIS functions for proper implementation
      }

      // Custom business logic conditions
      if (conditions.custom_checks) {
        for (const check of conditions.custom_checks) {
          const result = await this.evaluateCustomCondition(check, context, tenantId, userId)
          if (!result) {
            return false
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error checking conditions:', error)
      return false
    }
  }

  private async evaluateCustomCondition(
    condition: any,
    context?: Record<string, any>,
    tenantId?: string,
    userId?: string
  ): Promise<boolean> {
    // Implement custom condition evaluation logic
    // This could include database queries, external API calls, etc.
    
    switch (condition.type) {
      case 'asset_ownership':
        // Check if user owns or is assigned to the asset
        if (context?.asset_id && userId) {
          const supabase = await this.getSupabaseClient()
          const { data: asset } = await supabase
            .from('assets')
            .select('assignee_id, created_by')
            .eq('id', context.asset_id)
            .single()

          return asset?.assignee_id === userId || asset?.created_by === userId
        }
        return false

      case 'department_membership':
        // Check if user belongs to required department
        if (condition.required_department && userId && tenantId) {
          const supabase = await this.getSupabaseClient()
          const { data: userDept } = await supabase
            .from('user_departments')
            .select('department_id')
            .eq('user_id', userId)
            .eq('tenant_id', tenantId)
            .single()

          return userDept?.department_id === condition.required_department
        }
        return false

      case 'approval_required':
        // Check if action requires approval and if user can approve
        if (condition.approval_level && context?.action) {
          // This would integrate with workflow system
          return true // Placeholder
        }
        return false

      default:
        console.warn(`Unknown custom condition type: ${condition.type}`)
        return true
    }
  }

  // =====================================================
  // PERMISSION USAGE LOGGING
  // =====================================================

  private async logPermissionUsage(
    tenantId: string,
    userId: string,
    request: PermissionCheckRequest,
    wasGranted: boolean,
    denialReason?: string | null,
    responseTimeMs?: number
  ): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Get permission ID
      const { data: permission } = await supabase
        .from('permissions')
        .select('id, resource_type')
        .eq('name', request.permission_name)
        .single()

      if (!permission) {
        return
      }

      const usage: PermissionUsageInsert = {
        tenant_id: tenantId,
        user_id: userId,
        permission_id: permission.id,
        resource_type: permission.resource_type,
        resource_id: request.resource_id,
        endpoint: request.context?.endpoint,
        method: request.context?.method,
        ip_address: request.context?.ip_address,
        user_agent: request.context?.user_agent,
        session_id: request.context?.session_id,
        was_granted: wasGranted,
        denial_reason: denialReason || undefined,
        response_time_ms: responseTimeMs
      }

      await supabase
        .from('permission_usage')
        .insert(usage)
    } catch (error) {
      // Don't throw errors for logging failures
      console.error('Error logging permission usage:', error)
    }
  }

  // =====================================================
  // CACHE MANAGEMENT
  // =====================================================

  clearUserPermissionCache(tenantId: string, userId: string): void {
    globalPermissionCache.invalidateUser(tenantId, userId)
  }

  clearAllPermissionCache(): void {
    globalPermissionCache.clearAll()
  }

  clearTenantPermissionCache(tenantId: string): void {
    globalPermissionCache.invalidateTenant(tenantId)
  }

  clearPermissionCache(permissionName: string): void {
    globalPermissionCache.invalidatePermission(permissionName)
  }

  // =====================================================
  // PERMISSION ANALYTICS
  // =====================================================

  async getPermissionUsageStats(
    tenantId: string,
    userId?: string,
    days = 30
  ): Promise<{
    total_checks: number
    granted_checks: number
    denied_checks: number
    avg_response_time_ms: number
    top_permissions: { permission_name: string; usage_count: number }[]
    denial_reasons: { reason: string; count: number }[]
  }> {
    try {
      const supabase = await this.getSupabaseClient()
      
      let query = supabase
        .from('permission_usage')
        .select(`
          was_granted,
          response_time_ms,
          denial_reason,
          permissions (name)
        `)
        .eq('tenant_id', tenantId)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: usage, error } = await query

      if (error) {
        throw new Error(`Failed to get permission usage stats: ${error.message}`)
      }

      const totalChecks = usage?.length || 0
      const grantedChecks = usage?.filter((u: any) => u.was_granted).length || 0
      const deniedChecks = totalChecks - grantedChecks
      const avgResponseTime = usage?.reduce((sum: number, u: any) => sum + (u.response_time_ms || 0), 0) / totalChecks || 0

      // Top permissions
      const permissionCounts = usage?.reduce((acc: Record<string, number>, u: any) => {
        const permName = (u.permissions as any)?.name || 'Unknown'
        acc[permName] = (acc[permName] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const topPermissions = Object.entries(permissionCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([permission_name, usage_count]) => ({ permission_name, usage_count: usage_count as number }))

      // Denial reasons
      const denialCounts = usage?.filter((u: any) => !u.was_granted && u.denial_reason)
        .reduce((acc: Record<string, number>, u: any) => {
          acc[u.denial_reason!] = (acc[u.denial_reason!] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

      const denialReasons = Object.entries(denialCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([reason, count]) => ({ reason, count: count as number }))

      return {
        total_checks: totalChecks,
        granted_checks: grantedChecks,
        denied_checks: deniedChecks,
        avg_response_time_ms: avgResponseTime,
        top_permissions: topPermissions,
        denial_reasons: denialReasons
      }
    } catch (error) {
      console.error('Error getting permission usage stats:', error)
      throw error
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  async refreshUserPermissions(tenantId: string, userId: string): Promise<UserPermission[]> {
    // Clear cache and fetch fresh permissions
    this.clearUserPermissionCache(tenantId, userId)
    return this.getUserPermissions(tenantId, userId, false)
  }

  getCacheStats() {
    return globalPermissionCache.getStats()
  }

  async validatePermissionName(permissionName: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data: permission } = await supabase
        .from('permissions')
        .select('id')
        .eq('name', permissionName)
        .single()

      return !!permission
    } catch (error) {
      return false
    }
  }

  async getResourceTypePermissions(resourceType: ResourceType): Promise<string[]> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data: permissions } = await supabase
        .from('permissions')
        .select('name')
        .eq('resource_type', resourceType)
        .order('action')

      return permissions?.map((p: any) => p.name) || []
    } catch (error) {
      console.error('Error getting resource type permissions:', error)
      return []
    }
  }
}