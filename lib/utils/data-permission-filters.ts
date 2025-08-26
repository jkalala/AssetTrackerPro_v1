// =====================================================
// DATA-LEVEL PERMISSION FILTERS
// =====================================================
// Utilities for filtering data based on user permissions

import { createClient } from '@/lib/supabase/server'
import { PermissionService } from '@/lib/services/permission-service'
import { UserPermission } from '@/lib/types/rbac'

export interface DataFilterOptions {
  tenantId: string
  userId: string
  resourceType: string
  action: string
  includeInherited?: boolean
}

export interface FilterResult<T> {
  data: T[]
  filtered: boolean
  totalCount: number
  filteredCount: number
  appliedFilters: string[]
}

export class DataPermissionFilter {
  private permissionService = new PermissionService()

  // =====================================================
  // ASSET FILTERING
  // =====================================================

  async filterAssets<T extends { id: string; assignee_id?: string; department?: string; created_by?: string }>(
    assets: T[],
    options: DataFilterOptions
  ): Promise<FilterResult<T>> {
    const userPermissions = await this.permissionService.getUserPermissions(
      options.tenantId,
      options.userId
    )

    const assetPermissions = userPermissions.filter(p => 
      p.resource_type === 'asset' && p.action === options.action
    )

    if (assetPermissions.length === 0) {
      return {
        data: [],
        filtered: true,
        totalCount: assets.length,
        filteredCount: 0,
        appliedFilters: ['no_permission']
      }
    }

    // Check if user has global asset permission
    const globalPermission = assetPermissions.find(p => 
      p.scope === 'global' || p.scope === 'tenant'
    )

    if (globalPermission && !this.hasResourceFilters(globalPermission)) {
      return {
        data: assets,
        filtered: false,
        totalCount: assets.length,
        filteredCount: assets.length,
        appliedFilters: []
      }
    }

    // Apply resource-specific filters
    const filteredAssets: T[] = []
    const appliedFilters: string[] = []

    for (const asset of assets) {
      let hasAccess = false

      for (const permission of assetPermissions) {
        if (await this.checkAssetAccess(asset, permission, options)) {
          hasAccess = true
          break
        }
      }

      if (hasAccess) {
        filteredAssets.push(asset)
      }
    }

    if (filteredAssets.length < assets.length) {
      appliedFilters.push('resource_filters')
    }

    return {
      data: filteredAssets,
      filtered: filteredAssets.length < assets.length,
      totalCount: assets.length,
      filteredCount: filteredAssets.length,
      appliedFilters
    }
  }

  private async checkAssetAccess<T extends { id: string; assignee_id?: string; department?: string; created_by?: string }>(
    asset: T,
    permission: UserPermission,
    options: DataFilterOptions
  ): Promise<boolean> {
    // Check scope-based access
    switch (permission.scope) {
      case 'global':
      case 'tenant':
        return true

      case 'department':
        if (asset.department) {
          // Check if user is in the same department
          const userDepartment = await this.getUserDepartment(options.tenantId, options.userId)
          return asset.department === userDepartment
        }
        return false

      case 'personal':
        // User can only access assets they own or are assigned to
        return asset.assignee_id === options.userId || asset.created_by === options.userId

      default:
        return false
    }
  }

  // =====================================================
  // USER FILTERING
  // =====================================================

  async filterUsers<T extends { id: string; tenant_id: string; department?: string }>(
    users: T[],
    options: DataFilterOptions
  ): Promise<FilterResult<T>> {
    const userPermissions = await this.permissionService.getUserPermissions(
      options.tenantId,
      options.userId
    )

    const userManagePermissions = userPermissions.filter(p => 
      p.resource_type === 'user' && p.action === options.action
    )

    if (userManagePermissions.length === 0) {
      return {
        data: [],
        filtered: true,
        totalCount: users.length,
        filteredCount: 0,
        appliedFilters: ['no_permission']
      }
    }

    // Check if user has global user management permission
    const globalPermission = userManagePermissions.find(p => 
      p.scope === 'global' || p.scope === 'tenant'
    )

    if (globalPermission && !this.hasResourceFilters(globalPermission)) {
      return {
        data: users,
        filtered: false,
        totalCount: users.length,
        filteredCount: users.length,
        appliedFilters: []
      }
    }

    // Apply department-based filtering
    const filteredUsers: T[] = []
    const appliedFilters: string[] = []

    const userDepartment = await this.getUserDepartment(options.tenantId, options.userId)

    for (const user of users) {
      let hasAccess = false

      for (const permission of userManagePermissions) {
        if (await this.checkUserAccess(user, permission, options, userDepartment || undefined)) {
          hasAccess = true
          break
        }
      }

      if (hasAccess) {
        filteredUsers.push(user)
      }
    }

    if (filteredUsers.length < users.length) {
      appliedFilters.push('department_filters')
    }

    return {
      data: filteredUsers,
      filtered: filteredUsers.length < users.length,
      totalCount: users.length,
      filteredCount: filteredUsers.length,
      appliedFilters
    }
  }

  private async checkUserAccess<T extends { id: string; tenant_id: string; department?: string }>(
    user: T,
    permission: UserPermission,
    options: DataFilterOptions,
    currentUserDepartment?: string
  ): Promise<boolean> {
    switch (permission.scope) {
      case 'global':
      case 'tenant':
        return true

      case 'department':
        // User can only manage users in their department
        return user.department === currentUserDepartment

      case 'personal':
        // User can only manage themselves
        return user.id === options.userId

      default:
        return false
    }
  }

  // =====================================================
  // REPORT FILTERING
  // =====================================================

  async filterReports<T extends { id: string; created_by: string; is_public?: boolean; department?: string }>(
    reports: T[],
    options: DataFilterOptions
  ): Promise<FilterResult<T>> {
    const userPermissions = await this.permissionService.getUserPermissions(
      options.tenantId,
      options.userId
    )

    const reportPermissions = userPermissions.filter(p => 
      p.resource_type === 'report' && p.action === options.action
    )

    if (reportPermissions.length === 0) {
      return {
        data: [],
        filtered: true,
        totalCount: reports.length,
        filteredCount: 0,
        appliedFilters: ['no_permission']
      }
    }

    const filteredReports: T[] = []
    const appliedFilters: string[] = []

    const userDepartment = await this.getUserDepartment(options.tenantId, options.userId)

    for (const report of reports) {
      let hasAccess = false

      // Check if report is public
      if (report.is_public) {
        hasAccess = true
      } else {
        // Check permission-based access
        for (const permission of reportPermissions) {
          if (await this.checkReportAccess(report, permission, options, userDepartment || undefined)) {
            hasAccess = true
            break
          }
        }
      }

      if (hasAccess) {
        filteredReports.push(report)
      }
    }

    if (filteredReports.length < reports.length) {
      appliedFilters.push('visibility_filters')
    }

    return {
      data: filteredReports,
      filtered: filteredReports.length < reports.length,
      totalCount: reports.length,
      filteredCount: filteredReports.length,
      appliedFilters
    }
  }

  private async checkReportAccess<T extends { id: string; created_by: string; is_public?: boolean; department?: string }>(
    report: T,
    permission: UserPermission,
    options: DataFilterOptions,
    currentUserDepartment?: string
  ): Promise<boolean> {
    switch (permission.scope) {
      case 'global':
      case 'tenant':
        return true

      case 'department':
        return report.department === currentUserDepartment

      case 'personal':
        return report.created_by === options.userId

      default:
        return false
    }
  }

  // =====================================================
  // DATABASE QUERY FILTERING
  // =====================================================

  async buildAssetQuery(
    baseQuery: any,
    options: DataFilterOptions
  ): Promise<any> {
    const userPermissions = await this.permissionService.getUserPermissions(
      options.tenantId,
      options.userId
    )

    const assetPermissions = userPermissions.filter(p => 
      p.resource_type === 'asset' && p.action === options.action
    )

    if (assetPermissions.length === 0) {
      // No permission - return query that returns no results
      return baseQuery.eq('id', 'no-access')
    }

    // Check if user has global permission
    const globalPermission = assetPermissions.find(p => 
      p.scope === 'global' || p.scope === 'tenant'
    )

    if (globalPermission && !this.hasResourceFilters(globalPermission)) {
      // User has global access - return original query
      return baseQuery
    }

    // Build filtered query based on permissions
    const conditions: string[] = []

    for (const permission of assetPermissions) {
      switch (permission.scope) {
        case 'department':
          const userDepartment = await this.getUserDepartment(options.tenantId, options.userId)
          if (userDepartment) {
            conditions.push(`department.eq.${userDepartment}`)
          }
          break

        case 'personal':
          conditions.push(`assignee_id.eq.${options.userId}`)
          conditions.push(`created_by.eq.${options.userId}`)
          break
      }
    }

    if (conditions.length > 0) {
      // Apply OR conditions
      return baseQuery.or(conditions.join(','))
    }

    return baseQuery
  }

  async buildUserQuery(
    baseQuery: any,
    options: DataFilterOptions
  ): Promise<any> {
    const userPermissions = await this.permissionService.getUserPermissions(
      options.tenantId,
      options.userId
    )

    const userManagePermissions = userPermissions.filter(p => 
      p.resource_type === 'user' && p.action === options.action
    )

    if (userManagePermissions.length === 0) {
      return baseQuery.eq('id', 'no-access')
    }

    const globalPermission = userManagePermissions.find(p => 
      p.scope === 'global' || p.scope === 'tenant'
    )

    if (globalPermission && !this.hasResourceFilters(globalPermission)) {
      return baseQuery
    }

    const conditions: string[] = []

    for (const permission of userManagePermissions) {
      switch (permission.scope) {
        case 'department':
          const userDepartment = await this.getUserDepartment(options.tenantId, options.userId)
          if (userDepartment) {
            conditions.push(`department.eq.${userDepartment}`)
          }
          break

        case 'personal':
          conditions.push(`id.eq.${options.userId}`)
          break
      }
    }

    if (conditions.length > 0) {
      return baseQuery.or(conditions.join(','))
    }

    return baseQuery
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private hasResourceFilters(permission: UserPermission): boolean {
    return permission.resource_filters && 
           Object.keys(permission.resource_filters).length > 0
  }

  private async getUserDepartment(tenantId: string, userId: string): Promise<string | null> {
    try {
      const supabase = await createClient()
      const { data: userDept } = await supabase
        .from('user_departments')
        .select('department_id')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single()

      return userDept?.department_id || null
    } catch (error) {
      console.error('Error getting user department:', error)
      return null
    }
  }

  // =====================================================
  // BATCH FILTERING
  // =====================================================

  async filterMultipleResourceTypes<T>(
    resources: Array<{
      type: string
      data: T[]
      action: string
    }>,
    options: Omit<DataFilterOptions, 'resourceType' | 'action'>
  ): Promise<Array<{
    type: string
    result: FilterResult<T>
  }>> {
    const results = []

    for (const resource of resources) {
      let result: FilterResult<T>

      switch (resource.type) {
        case 'asset':
          result = await this.filterAssets(resource.data as any, {
            ...options,
            resourceType: resource.type,
            action: resource.action
          }) as FilterResult<T>
          break

        case 'user':
          result = await this.filterUsers(resource.data as any, {
            ...options,
            resourceType: resource.type,
            action: resource.action
          }) as FilterResult<T>
          break

        case 'report':
          result = await this.filterReports(resource.data as any, {
            ...options,
            resourceType: resource.type,
            action: resource.action
          }) as FilterResult<T>
          break

        default:
          result = {
            data: resource.data,
            filtered: false,
            totalCount: resource.data.length,
            filteredCount: resource.data.length,
            appliedFilters: []
          }
      }

      results.push({
        type: resource.type,
        result
      })
    }

    return results
  }
}

// =====================================================
// GLOBAL INSTANCE
// =====================================================

export const globalDataFilter = new DataPermissionFilter()

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

export async function filterAssetsByPermissions<T extends { id: string; assignee_id?: string; department?: string; created_by?: string }>(
  assets: T[],
  tenantId: string,
  userId: string,
  action: string = 'read'
): Promise<FilterResult<T>> {
  return globalDataFilter.filterAssets(assets, {
    tenantId,
    userId,
    resourceType: 'asset',
    action
  })
}

export async function filterUsersByPermissions<T extends { id: string; tenant_id: string; department?: string }>(
  users: T[],
  tenantId: string,
  userId: string,
  action: string = 'read'
): Promise<FilterResult<T>> {
  return globalDataFilter.filterUsers(users, {
    tenantId,
    userId,
    resourceType: 'user',
    action
  })
}

export async function buildPermissionFilteredQuery(
  baseQuery: any,
  resourceType: string,
  action: string,
  tenantId: string,
  userId: string
): Promise<any> {
  const options = { tenantId, userId, resourceType, action }

  switch (resourceType) {
    case 'asset':
      return globalDataFilter.buildAssetQuery(baseQuery, options)
    case 'user':
      return globalDataFilter.buildUserQuery(baseQuery, options)
    default:
      return baseQuery
  }
}