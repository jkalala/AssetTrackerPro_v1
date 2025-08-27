// =====================================================
// DEPARTMENT SERVICE
// =====================================================
// Service for managing organizational departments and hierarchy

import { createClient } from '@/lib/supabase/server'
export class DepartmentService {
  private async getSupabase() {
    return createClient()
  }

  // =====================================================
  // DEPARTMENT MANAGEMENT
  // =====================================================

  async createDepartment(tenantId: string, departmentData: Omit<DepartmentInsert, 'tenant_id' | 'created_by'>, createdBy: string): Promise<Department> {
    try {
      const supabase = await this.getSupabase()
      
      // Validate department name uniqueness
      const { data: existingDept } = await supabase
        .from('departments')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('name', departmentData.name)
        .single()

      if (existingDept) {
        throw new Error(`Department with name '${departmentData.name}' already exists`)
      }

      // Validate department code uniqueness if provided
      if (departmentData.code) {
        const { data: existingCode } = await supabase
          .from('departments')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('code', departmentData.code)
          .single()

        if (existingCode) {
          throw new Error(`Department with code '${departmentData.code}' already exists`)
        }
      }

      // Validate parent department exists if specified
      if (departmentData.parent_department_id) {
        const { data: parentDept } = await supabase
          .from('departments')
          .select('id, level')
          .eq('id', departmentData.parent_department_id)
          .eq('tenant_id', tenantId)
          .single()

        if (!parentDept) {
          throw new Error('Parent department not found')
        }

        // Check hierarchy depth limit
        if (parentDept.level >= 10) {
          throw new Error('Maximum department hierarchy depth exceeded')
        }
      }

      // Create department
      const { data: department, error } = await supabase
        .from('departments')
        .insert({
          ...departmentData,
          tenant_id: _tenantId,
          created_by: createdBy
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create department: ${error.message}`)
      }

      return department
    } catch (_error) {
      console.error('Error creating department:', error)
      throw error
    }
  }

  async updateDepartment(tenantId: string, departmentId: string, updates: DepartmentUpdate): Promise<Department> {
    try {
      const supabase = await this.getSupabase()
      
      // Check if department exists
      const { data: existingDept } = await supabase
        .from('departments')
        .select('id, _name, code')
        .eq('id', departmentId)
        .eq('tenant_id', tenantId)
        .single()

      if (!existingDept) {
        throw new Error('Department not found')
      }

      // Validate name uniqueness if being updated
      if (updates.name && updates.name !== existingDept.name) {
        const { data: nameConflict } = await supabase
          .from('departments')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('name', updates.name)
          .neq('id', departmentId)
          .single()

        if (nameConflict) {
          throw new Error(`Department with name '${updates.name}' already exists`)
        }
      }

      // Validate code uniqueness if being updated
      if (updates.code && updates.code !== existingDept.code) {
        const { data: codeConflict } = await supabase
          .from('departments')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('code', updates.code)
          .neq('id', departmentId)
          .single()

        if (codeConflict) {
          throw new Error(`Department with code '${updates.code}' already exists`)
        }
      }

      // Validate parent department if being updated
      if (updates.parent_department_id) {
        const { data: parentDept } = await supabase
          .from('departments')
          .select('id, level, hierarchy_path')
          .eq('id', updates.parent_department_id)
          .eq('tenant_id', tenantId)
          .single()

        if (!parentDept) {
          throw new Error('Parent department not found')
        }

        // Prevent circular references
        if (parentDept.hierarchy_path?.includes(departmentId)) {
          throw new Error('Circular reference detected in department hierarchy')
        }
      }

      const { data: department, error } = await supabase
        .from('departments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', departmentId)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update department: ${error.message}`)
      }

      return department
    } catch (_error) {
      console.error('Error updating department:', error)
      throw error
    }
  }

  async deleteDepartment(tenantId: string, departmentId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      // Check if department exists
      const { data: department } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', departmentId)
        .eq('tenant_id', tenantId)
        .single()

      if (!department) {
        throw new Error('Department not found')
      }

      // Check if department has users assigned
      const { data: userDepts } = await supabase
        .from('user_departments')
        .select('id')
        .eq('department_id', departmentId)
        .eq('tenant_id', tenantId)
        .limit(1)

      if (userDepts && userDepts.length > 0) {
        throw new Error('Cannot delete department with assigned users')
      }

      // Check if department has child departments
      const { data: childDepts } = await supabase
        .from('departments')
        .select('id')
        .eq('parent_department_id', departmentId)
        .eq('tenant_id', tenantId)
        .limit(1)

      if (childDepts && childDepts.length > 0) {
        throw new Error('Cannot delete department with child departments')
      }

      // Delete department roles first
      await supabase
        .from('department_roles')
        .delete()
        .eq('department_id', departmentId)
        .eq('tenant_id', tenantId)

      // Delete the department
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId)
        .eq('tenant_id', tenantId)

      if (error) {
        throw new Error(`Failed to delete department: ${error.message}`)
      }

      return true
    } catch (_error) {
      console.error('Error deleting department:', error)
      throw error
    }
  }

  async getDepartment(tenantId: string, departmentId: string): Promise<DepartmentWithHierarchy | null> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: department } = await supabase
        .from('departments')
        .select(`
          *,
          manager:profiles!departments_manager_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('id', departmentId)
        .eq('tenant_id', tenantId)
        .single()

      if (!department) {
        return null
      }

      // Get user count
      const { data: userCount } = await supabase
        .from('user_departments')
        .select('id')
        .eq('department_id', departmentId)
        .eq('tenant_id', tenantId)

      // Get department roles
      const { data: deptRoles } = await supabase
        .from('department_roles')
        .select(`
          *,
          roles (
            id,
            _name,
            display_name,
            description
          )
        `)
        .eq('department_id', departmentId)
        .eq('tenant_id', tenantId)

      return {
        ...department,
        user_count: userCount?.length || 0,
        roles: deptRoles?.map(dr => dr.roles).filter(Boolean) || []
      }
    } catch (_error) {
      console.error('Error getting department:', error)
      throw error
    }
  }

  async getDepartments(tenantId: string, includeInactive = false): Promise<Department[]> {
    try {
      const supabase = await this.getSupabase()
      
      let _query = supabase
        .from('departments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('level', { ascending: true })
        .order('name', { ascending: true })

      if (!includeInactive) {
        _query = query.eq('is_active', true)
      }

      const { data: departments, error } = await query

      if (error) {
        throw new Error(`Failed to get departments: ${error.message}`)
      }

      return departments || []
    } catch (_error) {
      console.error('Error getting departments:', error)
      throw error
    }
  }

  async getDepartmentHierarchy(tenantId: string): Promise<DepartmentHierarchyNode[]> {
    try {
      const supabase = await this.getSupabase()
      const departments = await this.getDepartments(tenantId)
      
      // Get user counts for each department
      const { data: userCounts } = await supabase
        .from('user_departments')
        .select('department_id')
        .eq('tenant_id', tenantId)

      const _userCountMap = userCounts?.reduce((acc, ud) => {
        acc[ud.department_id] = (acc[ud.department_id] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Get roles for each department
      const { data: deptRoles } = await supabase
        .from('department_roles')
        .select(`
          department_id,
          roles (
            id,
            _name,
            display_name,
            description
          )
        `)
        .eq('tenant_id', tenantId)

      const roleMap = deptRoles?.reduce((acc, dr) => {
        if (!acc[dr.department_id]) {
          acc[dr.department_id] = []
        }
        if (dr.roles) {
          acc[dr.department_id].push(dr.roles)
        }
        return acc
      }, {} as Record<string, any[]>) || {}

      // Build hierarchy
      const deptMap = new Map<string, DepartmentHierarchyNode>()
      const rootNodes: DepartmentHierarchyNode[] = []

      // Create nodes
      departments.forEach(dept => {
        const node: DepartmentHierarchyNode = {
          department: dept,
          children: [],
          users: [], // Will be populated if needed
          roles: roleMap[dept.id] || []
        }
        deptMap.set(dept.id, node)
      })

      // Build hierarchy
      departments.forEach(dept => {
        const node = deptMap.get(dept.id)!
        if (dept.parent_department_id) {
          const parent = deptMap.get(dept.parent_department_id)
          if (parent) {
            parent.children.push(node)
          }
        } else {
          rootNodes.push(node)
        }
      })

      return rootNodes
    } catch (_error) {
      console.error('Error getting department hierarchy:', error)
      throw error
    }
  }

  // =====================================================
  // USER-DEPARTMENT ASSIGNMENTS
  // =====================================================

  async assignUserToDepartment(
    tenantId: string, 
    userId: string, 
    departmentId: string, 
    isPrimary = false,
    roleInDepartment?: string,
    assignedBy?: string
  ): Promise<UserDepartment> {
    try {
      const supabase = await this.getSupabase()
      
      // Validate department exists
      const { data: department } = await supabase
        .from('departments')
        .select('id, is_active')
        .eq('id', departmentId)
        .eq('tenant_id', tenantId)
        .single()

      if (!department) {
        throw new Error('Department not found')
      }

      if (!department.is_active) {
        throw new Error('Cannot assign user to inactive department')
      }

      // Validate user exists in tenant
      const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .eq('tenant_id', tenantId)
        .single()

      if (!user) {
        throw new Error('User not found in tenant')
      }

      // If setting as primary, unset other primary assignments
      if (isPrimary) {
        await supabase
          .from('user_departments')
          .update({ is_primary: false })
          .eq('user_id', userId)
          .eq('tenant_id', tenantId)
      }

      const { data: assignment, error } = await supabase
        .from('user_departments')
        .insert({
          tenant_id: _tenantId,
          user_id: _userId,
          department_id: departmentId,
          is_primary: isPrimary,
          role_in_department: roleInDepartment,
          assigned_by: assignedBy || userId
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          // Update existing assignment
          const { data: updated, error: updateError } = await supabase
            .from('user_departments')
            .update({
              is_primary: isPrimary,
              role_in_department: roleInDepartment,
              assigned_by: assignedBy || _userId,
              assigned_at: new Date().toISOString()
            })
            .eq('tenant_id', tenantId)
            .eq('user_id', userId)
            .eq('department_id', departmentId)
            .select()
            .single()

          if (updateError) {
            throw new Error(`Failed to update department assignment: ${updateError.message}`)
          }

          return updated
        }

        throw new Error(`Failed to assign user to department: ${error.message}`)
      }

      return assignment
    } catch (_error) {
      console.error('Error assigning user to department:', error)
      throw error
    }
  }

  async removeUserFromDepartment(tenantId: string, userId: string, departmentId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      const { error } = await supabase
        .from('user_departments')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('department_id', departmentId)

      if (error) {
        throw new Error(`Failed to remove user from department: ${error.message}`)
      }

      return true
    } catch (_error) {
      console.error('Error removing user from department:', error)
      throw error
    }
  }

  async getUserDepartments(tenantId: string, userId: string): Promise<(Department & { is_primary: boolean; role_in_department?: string })[]> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: userDepts, error } = await supabase
        .from('user_departments')
        .select(`
          is_primary,
          role_in_department,
          departments (
            id,
            _name,
            display_name,
            description,
            code,
            department_type,
            level,
            hierarchy_path,
            is_active
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })

      if (error) {
        throw new Error(`Failed to get user departments: ${error.message}`)
      }

      return userDepts?.map((ud: Record<string, unknown>) => ({
        ...(ud.departments as any),
        is_primary: ud.is_primary,
        role_in_department: ud.role_in_department
      })) || []
    } catch (_error) {
      console.error('Error getting user departments:', error)
      throw error
    }
  }

  async getDepartmentUsers(tenantId: string, departmentId: string): Promise<any[]> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: deptUsers, error } = await supabase
        .from('user_departments')
        .select(`
          is_primary,
          role_in_department,
          assigned_at,
          profiles (
            id,
            email,
            full_name,
            avatar_url,
            job_title
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('department_id', departmentId)
        .order('is_primary', { ascending: false })
        .order('assigned_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to get department users: ${error.message}`)
      }

      return deptUsers?.map((du: Record<string, unknown>) => ({
        ...(du.profiles as any),
        is_primary: du.is_primary,
        role_in_department: du.role_in_department,
        assigned_at: du.assigned_at
      })) || []
    } catch (_error) {
      console.error('Error getting department users:', error)
      throw error
    }
  }

  // =====================================================
  // DEPARTMENT ROLES
  // =====================================================

  async assignRoleToDepartment(
    tenantId: string,
    departmentId: string,
    roleId: string,
    isDefaultRole = false,
    maxUsers?: number,
    createdBy?: string
  ): Promise<DepartmentRole> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: deptRole, error } = await supabase
        .from('department_roles')
        .insert({
          tenant_id: _tenantId,
          department_id: departmentId,
          role_id: roleId,
          is_default_role: isDefaultRole,
          max_users: maxUsers,
          created_by: createdBy || 'system'
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('Role is already assigned to this department')
        }
        throw new Error(`Failed to assign role to department: ${error.message}`)
      }

      return deptRole
    } catch (_error) {
      console.error('Error assigning role to department:', error)
      throw error
    }
  }

  async removeRoleFromDepartment(tenantId: string, departmentId: string, roleId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      const { error } = await supabase
        .from('department_roles')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('department_id', departmentId)
        .eq('role_id', roleId)

      if (error) {
        throw new Error(`Failed to remove role from department: ${error.message}`)
      }

      return true
    } catch (_error) {
      console.error('Error removing role from department:', error)
      throw error
    }
  }

  // =====================================================
  // ANALYTICS AND REPORTING
  // =====================================================

  async getDepartmentAnalytics(tenantId: string, departmentId: string, _days = 30): Promise<DepartmentAnalytics> {
    try {
      const supabase = await this.getSupabase()
      const department = await this.getDepartment(_tenantId, departmentId)
      if (!department) {
        throw new Error('Department not found')
      }

      // Get user count
      const users = await this.getDepartmentUsers(_tenantId, departmentId)
      const userCount = users.length

      // Get role distribution
      const { data: roleDistribution } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (_name, display_name)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .in('user_id', users.map(u => u.id))

      const roleDistMap = roleDistribution?.reduce((acc: Record<string, number>, ur: Record<string, unknown>) => {
        const roleName = (ur.roles as any)?.display_name || (ur.roles as any)?.name || 'Unknown'
        acc[roleName] = (acc[roleName] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const roleDistributionArray = Object.entries(roleDistMap).map(([role_name, user_count]) => ({
        role_name,
        user_count
      }))

      // Get permission usage (placeholder - would need actual implementation)
      const permissionUsage = [
        { permission_name: 'read:asset', usage_count: 150 },
        { permission_name: 'create:asset', usage_count: 45 },
        { permission_name: 'update:asset', usage_count: 89 }
      ]

      return {
        department_id: departmentId,
        department_name: department._name,
        user_count: userCount,
        role_distribution: roleDistributionArray,
        permission_usage: permissionUsage
      }
    } catch (_error) {
      console.error('Error getting department analytics:', error)
      throw error
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  async validateDepartmentHierarchy(tenantId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      // Check for circular references
      const { data: departments } = await supabase
        .from('departments')
        .select('id, parent_department_id, hierarchy_path')
        .eq('tenant_id', tenantId)

      if (!departments) return true

      for (const dept of departments) {
        if (dept.parent_department_id && dept.hierarchy_path?.includes(dept.id)) {
          throw new Error(`Circular reference detected for department ${dept.id}`)
        }
      }

      return true
    } catch (_error) {
      console.error('Error validating department hierarchy:', error)
      throw error
    }
  }

  async searchDepartments(tenantId: string, query: string, limit = 10): Promise<Department[]> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: departments, error } = await supabase
        .from('departments')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,display_name.ilike.%${query}%,code.ilike.%${query}%`)
        .limit(limit)
        .order('name')

      if (error) {
        throw new Error(`Failed to search departments: ${error.message}`)
      }

      return departments || []
    } catch (_error) {
      console.error('Error searching departments:', error)
      throw error
    }
  }
}