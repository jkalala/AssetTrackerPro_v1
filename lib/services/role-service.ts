// =====================================================
// ROLE SERVICE
// =====================================================
// Service for managing hierarchical roles and permissions

import { createClient } from '@/lib/supabase/server'
import {
  Role,
  RoleInsert,
  RoleUpdate,
  RoleWithPermissions,
  Permission,
  RolePermission,
  UserRole,
  UserRoleInsert,
  CreateRoleRequest,
  AssignRoleRequest,
  RevokeRoleRequest,
  RoleHierarchyNode,
  RoleAnalytics,
  RBACError,
} from '@/lib/types/rbac'
import { Database } from '@/lib/types/database'

export class RoleService {
  private async getSupabase() {
    return await createClient()
  }

  // =====================================================
  // ROLE MANAGEMENT
  // =====================================================

  async createRole(tenantId: string, request: CreateRoleRequest, createdBy: string): Promise<Role> {
    try {
      // Validate role name uniqueness
      const supabase = await this.getSupabase()
      const { data: existingRole } = await supabase
        .from('roles')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('name', request.name)
        .single()

      if (existingRole) {
        throw new Error(`Role with name '${request.name}' already exists`)
      }

      // Validate parent role exists if specified
      if (request.parent_role_id) {
        const { data: parentRole } = await supabase
          .from('roles')
          .select('id, level')
          .eq('id', request.parent_role_id)
          .eq('tenant_id', tenantId)
          .single()

        if (!parentRole) {
          throw new Error('Parent role not found')
        }

        // Check hierarchy depth limit
        if (parentRole.level >= 10) {
          throw new Error('Maximum role hierarchy depth exceeded')
        }
      }

      // Create role using stored procedure
      const { data: roleId, error } = await supabase.rpc('create_role_with_permissions', {
        p_tenant_id: tenantId,
        p_name: request.name,
        p_display_name: request.display_name,
        p_description: request.description || null,
        p_parent_role_id: request.parent_role_id || null,
        p_permission_names: request.permission_names || [],
        p_created_by: createdBy,
      })

      if (error) {
        throw new Error(`Failed to create role: ${error.message}`)
      }

      // Fetch and return the created role
      const { data: role } = await supabase.from('roles').select('*').eq('id', roleId).single()

      if (!role) {
        throw new Error('Failed to retrieve created role')
      }

      return role
    } catch (error) {
      console.error('Error creating role:', error)
      throw error
    }
  }

  async updateRole(tenantId: string, roleId: string, updates: RoleUpdate): Promise<Role> {
    try {
      const supabase = await this.getSupabase()

      // Check if role exists and is not a system role
      const { data: existingRole } = await supabase
        .from('roles')
        .select('id, is_system_role')
        .eq('id', roleId)
        .eq('tenant_id', tenantId)
        .single()

      if (!existingRole) {
        throw new Error('Role not found')
      }

      if (existingRole.is_system_role) {
        throw new Error('Cannot modify system roles')
      }

      // Validate parent role if being updated
      if (updates.parent_role_id) {
        const { data: parentRole } = await supabase
          .from('roles')
          .select('id, level, hierarchy_path')
          .eq('id', updates.parent_role_id)
          .eq('tenant_id', tenantId)
          .single()

        if (!parentRole) {
          throw new Error('Parent role not found')
        }

        // Prevent circular references
        if (parentRole.hierarchy_path?.includes(roleId)) {
          throw new Error('Circular reference detected in role hierarchy')
        }
      }

      const { data: role, error } = await supabase
        .from('roles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roleId)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update role: ${error.message}`)
      }

      return role
    } catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  }

  async deleteRole(tenantId: string, roleId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()

      // Check if role exists and is not a system role
      const { data: role } = await supabase
        .from('roles')
        .select('id, is_system_role, name')
        .eq('id', roleId)
        .eq('tenant_id', tenantId)
        .single()

      if (!role) {
        throw new Error('Role not found')
      }

      if (role.is_system_role) {
        throw new Error('Cannot delete system roles')
      }

      // Check if role has users assigned
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role_id', roleId)
        .eq('is_active', true)
        .limit(1)

      if (userRoles && userRoles.length > 0) {
        throw new Error('Cannot delete role with active user assignments')
      }

      // Check if role has child roles
      const { data: childRoles } = await supabase
        .from('roles')
        .select('id')
        .eq('parent_role_id', roleId)
        .eq('tenant_id', tenantId)
        .limit(1)

      if (childRoles && childRoles.length > 0) {
        throw new Error('Cannot delete role with child roles')
      }

      // Delete role permissions first
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('tenant_id', tenantId)

      // Delete the role
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId)
        .eq('tenant_id', tenantId)

      if (error) {
        throw new Error(`Failed to delete role: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Error deleting role:', error)
      throw error
    }
  }

  async getRole(tenantId: string, roleId: string): Promise<RoleWithPermissions | null> {
    try {
      const supabase = await this.getSupabase()

      const { data: role } = await supabase
        .from('roles')
        .select(
          `
          *,
          role_permissions (
            id,
            conditions,
            resource_filters,
            inherited_from_role_id,
            permissions (
              id,
              name,
              display_name,
              description,
              resource_type,
              action,
              scope
            )
          )
        `
        )
        .eq('id', roleId)
        .eq('tenant_id', tenantId)
        .single()

      if (!role) {
        return null
      }

      // Transform the data to match our interface
      const permissions =
        role.role_permissions?.map((rp: any) => ({
          ...rp.permissions,
          conditions: rp.conditions,
          resource_filters: rp.resource_filters,
          inherited_from_role_id: rp.inherited_from_role_id,
        })) || []

      return {
        ...role,
        permissions,
      }
    } catch (error) {
      console.error('Error getting role:', error)
      throw error
    }
  }

  async getRoles(tenantId: string, includeInactive = false): Promise<Role[]> {
    try {
      const supabase = await this.getSupabase()

      let query = supabase
        .from('roles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('level', { ascending: true })
        .order('name', { ascending: true })

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data: roles, error } = await query

      if (error) {
        throw new Error(`Failed to get roles: ${error.message}`)
      }

      return roles || []
    } catch (error) {
      console.error('Error getting roles:', error)
      throw error
    }
  }

  async getRoleHierarchy(tenantId: string): Promise<RoleHierarchyNode[]> {
    try {
      const supabase = await this.getSupabase()
      const roles = await this.getRoles(tenantId)

      // Get user counts for each role
      const { data: userCounts } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      const userCountMap =
        userCounts?.reduce(
          (acc, ur) => {
            acc[ur.role_id] = (acc[ur.role_id] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ) || {}

      // Get permissions for each role
      const { data: rolePermissions } = await supabase
        .from('role_permissions')
        .select(
          `
          role_id,
          permissions (
            id,
            name,
            display_name,
            resource_type,
            action,
            scope
          )
        `
        )
        .eq('tenant_id', tenantId)

      const permissionMap =
        rolePermissions?.reduce(
          (acc, rp) => {
            if (!acc[rp.role_id]) {
              acc[rp.role_id] = []
            }
            // rp.permissions is already an array of permissions
            if (Array.isArray(rp.permissions)) {
              acc[rp.role_id].push(
                ...rp.permissions.map((p: any) => ({
                  ...p,
                  is_system_permission: p.is_system_permission || false,
                  created_at: p.created_at || new Date().toISOString(),
                  updated_at: p.updated_at || new Date().toISOString(),
                }))
              )
            } else {
              const permission = rp.permissions as any
              acc[rp.role_id].push({
                ...permission,
                is_system_permission: permission.is_system_permission || false,
                created_at: permission.created_at || new Date().toISOString(),
                updated_at: permission.updated_at || new Date().toISOString(),
              })
            }
            return acc
          },
          {} as Record<string, Permission[]>
        ) || {}

      // Build hierarchy
      const roleMap = new Map<string, RoleHierarchyNode>()
      const rootNodes: RoleHierarchyNode[] = []

      // Create nodes
      roles.forEach(role => {
        const node: RoleHierarchyNode = {
          role,
          children: [],
          permissions: permissionMap[role.id] || [],
          user_count: userCountMap[role.id] || 0,
        }
        roleMap.set(role.id, node)
      })

      // Build hierarchy
      roles.forEach(role => {
        const node = roleMap.get(role.id)!
        if (role.parent_role_id) {
          const parent = roleMap.get(role.parent_role_id)
          if (parent) {
            parent.children.push(node)
          }
        } else {
          rootNodes.push(node)
        }
      })

      return rootNodes
    } catch (error) {
      console.error('Error getting role hierarchy:', error)
      throw error
    }
  }

  // =====================================================
  // ROLE ASSIGNMENT MANAGEMENT
  // =====================================================

  async assignRoleToUser(
    tenantId: string,
    request: AssignRoleRequest,
    assignedBy: string
  ): Promise<UserRole> {
    try {
      const supabase = await this.getSupabase()

      // Validate role exists
      const { data: role } = await supabase
        .from('roles')
        .select('id, max_users, is_active')
        .eq('id', request.role_id)
        .eq('tenant_id', tenantId)
        .single()

      if (!role) {
        throw new Error('Role not found')
      }

      if (!role.is_active) {
        throw new Error('Cannot assign inactive role')
      }

      // Check max users limit
      if (role.max_users) {
        const { data: currentAssignments } = await supabase
          .from('user_roles')
          .select('id')
          .eq('role_id', request.role_id)
          .eq('tenant_id', tenantId)
          .eq('is_active', true)

        if (currentAssignments && currentAssignments.length >= role.max_users) {
          throw new Error('Maximum users limit reached for this role')
        }
      }

      // Validate user exists in tenant
      const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', request.user_id)
        .eq('tenant_id', tenantId)
        .single()

      if (!user) {
        throw new Error('User not found in tenant')
      }

      // Use stored procedure to assign role
      const { data: assignmentId, error } = await supabase.rpc('assign_role_to_user', {
        p_tenant_id: tenantId,
        p_user_id: request.user_id,
        p_role_id: request.role_id,
        p_expires_at: request.expires_at || null,
        p_assigned_by: assignedBy,
      })

      if (error) {
        throw new Error(`Failed to assign role: ${error.message}`)
      }

      // Fetch and return the assignment
      const { data: assignment } = await supabase
        .from('user_roles')
        .select('*')
        .eq('id', assignmentId)
        .single()

      if (!assignment) {
        throw new Error('Failed to retrieve role assignment')
      }

      return assignment
    } catch (error) {
      console.error('Error assigning role to user:', error)
      throw error
    }
  }

  async revokeRoleFromUser(
    tenantId: string,
    request: RevokeRoleRequest,
    revokedBy: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()

      // Use stored procedure to revoke role
      const { data: success, error } = await supabase.rpc('revoke_role_from_user', {
        p_tenant_id: tenantId,
        p_user_id: request.user_id,
        p_role_id: request.role_id,
        p_reason: request.reason || null,
        p_revoked_by: revokedBy,
      })

      if (error) {
        throw new Error(`Failed to revoke role: ${error.message}`)
      }

      return success
    } catch (error) {
      console.error('Error revoking role from user:', error)
      throw error
    }
  }

  async getUserRoles(
    tenantId: string,
    userId: string
  ): Promise<(Role & { assigned_at: string; expires_at?: string; assigned_by: string })[]> {
    try {
      const supabase = await this.getSupabase()

      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(
          `
          assigned_at,
          expires_at,
          assigned_by,
          roles (
            id,
            name,
            display_name,
            description,
            level,
            hierarchy_path,
            is_system_role,
            is_default_role,
            is_active
          )
        `
        )
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to get user roles: ${error.message}`)
      }

      return (
        userRoles?.map((ur: any) => ({
          ...ur.roles,
          assigned_at: ur.assigned_at,
          expires_at: ur.expires_at,
          assigned_by: ur.assigned_by,
        })) || []
      )
    } catch (error) {
      console.error('Error getting user roles:', error)
      throw error
    }
  }

  async getRoleUsers(tenantId: string, roleId: string): Promise<any[]> {
    try {
      const supabase = await this.getSupabase()

      const { data: roleUsers, error } = await supabase
        .from('user_roles')
        .select(
          `
          assigned_at,
          expires_at,
          assigned_by,
          profiles (
            id,
            email,
            full_name,
            avatar_url,
            department,
            job_title
          )
        `
        )
        .eq('tenant_id', tenantId)
        .eq('role_id', roleId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to get role users: ${error.message}`)
      }

      return (
        roleUsers?.map((ru: any) => ({
          ...ru.profiles,
          assigned_at: ru.assigned_at,
          expires_at: ru.expires_at,
          assigned_by: ru.assigned_by,
        })) || []
      )
    } catch (error) {
      console.error('Error getting role users:', error)
      throw error
    }
  }

  // =====================================================
  // PERMISSION MANAGEMENT
  // =====================================================

  async addPermissionToRole(
    tenantId: string,
    roleId: string,
    permissionId: string,
    conditions?: Record<string, any>,
    resourceFilters?: Record<string, any>
  ): Promise<RolePermission> {
    try {
      const supabase = await this.getSupabase()

      const { data: rolePermission, error } = await supabase
        .from('role_permissions')
        .insert({
          tenant_id: tenantId,
          role_id: roleId,
          permission_id: permissionId,
          conditions: conditions || {},
          resource_filters: resourceFilters || {},
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to add permission to role: ${error.message}`)
      }

      return rolePermission
    } catch (error) {
      console.error('Error adding permission to role:', error)
      throw error
    }
  }

  async removePermissionFromRole(
    tenantId: string,
    roleId: string,
    permissionId: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()

      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('role_id', roleId)
        .eq('permission_id', permissionId)

      if (error) {
        throw new Error(`Failed to remove permission from role: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Error removing permission from role:', error)
      throw error
    }
  }

  async getSystemPermissions(): Promise<Permission[]> {
    try {
      const supabase = await this.getSupabase()

      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource_type', { ascending: true })
        .order('action', { ascending: true })

      if (error) {
        throw new Error(`Failed to get permissions: ${error.message}`)
      }

      return permissions || []
    } catch (error) {
      console.error('Error getting system permissions:', error)
      throw error
    }
  }

  // =====================================================
  // ANALYTICS AND REPORTING
  // =====================================================

  async getRoleAnalytics(tenantId: string, roleId: string, days = 30): Promise<RoleAnalytics> {
    try {
      const supabase = await this.getSupabase()
      const role = await this.getRole(tenantId, roleId)
      if (!role) {
        throw new Error('Role not found')
      }

      // Get user count
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('role_id', roleId)
        .eq('is_active', true)

      const userCount = userRoles?.length || 0

      // Get permission usage stats
      const { data: usageStats } = await supabase
        .from('permission_usage')
        .select('was_granted, response_time_ms, permission_id')
        .eq('tenant_id', tenantId)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .in('user_id', userRoles?.map(ur => ur.id) || [])

      const totalChecks = usageStats?.length || 0
      const grantedChecks = usageStats?.filter(us => us.was_granted).length || 0
      const deniedChecks = totalChecks - grantedChecks
      const avgResponseTime =
        totalChecks > 0
          ? (usageStats?.reduce((sum, us) => sum + (us.response_time_ms || 0), 0) || 0) /
            totalChecks
          : 0

      // Get most used permissions
      const permissionUsage =
        usageStats?.reduce(
          (acc, us) => {
            acc[us.permission_id] = (acc[us.permission_id] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ) || {}

      const mostUsedPermissions = Object.entries(permissionUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([permissionId, count]) => {
          const permission = role.permissions.find(p => p.id === permissionId)
          return {
            permission_name: permission?.name || 'Unknown',
            usage_count: count,
          }
        })

      return {
        role_id: roleId,
        role_name: role.name,
        user_count: userCount,
        permission_count: role.permissions.length,
        usage_stats: {
          total_checks: totalChecks,
          granted_checks: grantedChecks,
          denied_checks: deniedChecks,
          avg_response_time_ms: avgResponseTime,
        },
        most_used_permissions: mostUsedPermissions,
      }
    } catch (error) {
      console.error('Error getting role analytics:', error)
      throw error
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  async cleanupExpiredAssignments(tenantId: string): Promise<number> {
    try {
      const supabase = await this.getSupabase()

      const { data: count, error } = await supabase.rpc('cleanup_expired_role_assignments')

      if (error) {
        throw new Error(`Failed to cleanup expired assignments: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      console.error('Error cleaning up expired assignments:', error)
      throw error
    }
  }

  async validateRoleHierarchy(tenantId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()

      // Check for circular references
      const { data: roles } = await supabase
        .from('roles')
        .select('id, parent_role_id, hierarchy_path')
        .eq('tenant_id', tenantId)

      if (!roles) return true

      for (const role of roles) {
        if (role.parent_role_id && role.hierarchy_path?.includes(role.id)) {
          throw new Error(`Circular reference detected for role ${role.id}`)
        }
      }

      return true
    } catch (error) {
      console.error('Error validating role hierarchy:', error)
      throw error
    }
  }
}
