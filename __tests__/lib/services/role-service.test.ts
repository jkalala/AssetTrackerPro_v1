// =====================================================
// ROLE SERVICE TESTS
// =====================================================
// Tests for the hierarchical role service

/* eslint-disable @typescript-eslint/no-explicit-any */
import { RoleService } from '@/lib/services/role-service'
import { PermissionService } from '@/lib/services/permission-service'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

describe('RoleService', () => {
  let roleService: RoleService
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      rpc: jest.fn().mockReturnThis()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    roleService = new RoleService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      const tenantId = 'tenant-123'
      const roleData = {
        name: 'test_role',
        display_name: 'Test Role',
        description: 'A test role',
        permission_names: ['read:asset', 'create:asset']
      }
      const createdBy = 'user-123'

      // Mock existing role check (no existing role)
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

      // Mock role creation
      mockSupabase.rpc.mockResolvedValueOnce({ 
        data: 'role-456', 
        error: null 
      })

      // Mock role retrieval
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'role-456',
          tenant_id: tenantId,
          name: roleData.name,
          display_name: roleData.display_name,
          description: roleData.description,
          level: 0,
          is_active: true,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: null
      })

      const result = await roleService.createRole(tenantId, roleData, createdBy)

      expect(result).toBeDefined()
      expect(result.name).toBe(roleData.name)
      expect(result.display_name).toBe(roleData.display_name)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_role_with_permissions', {
        p_tenant_id: tenantId,
        p_name: roleData.name,
        p_display_name: roleData.display_name,
        p_description: roleData.description,
        p_parent_role_id: null,
        p_permission_names: roleData.permission_names,
        p_created_by: createdBy
      })
    })

    it('should throw error if role name already exists', async () => {
      const tenantId = 'tenant-123'
      const roleData = {
        name: 'existing_role',
        display_name: 'Existing Role'
      }
      const createdBy = 'user-123'

      // Mock existing role check (role exists)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'existing-role-id' },
        error: null
      })

      await expect(
        roleService.createRole(tenantId, roleData, createdBy)
      ).rejects.toThrow("Role with name 'existing_role' already exists")
    })
  })

  describe('updateRole', () => {
    it('should update a role successfully', async () => {
      const tenantId = 'tenant-123'
      const roleId = 'role-456'
      const updates = {
        display_name: 'Updated Role Name',
        description: 'Updated description'
      }

      // Mock role existence check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: roleId, is_system_role: false },
        error: null
      })

      // Mock role update
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: roleId,
          tenant_id: tenantId,
          display_name: updates.display_name,
          description: updates.description,
          updated_at: new Date().toISOString()
        },
        error: null
      })

      const result = await roleService.updateRole(tenantId, roleId, updates)

      expect(result).toBeDefined()
      expect(result.display_name).toBe(updates.display_name)
      expect(result.description).toBe(updates.description)
    })

    it('should throw error when trying to update system role', async () => {
      const tenantId = 'tenant-123'
      const roleId = 'system-role-456'
      const updates = { display_name: 'Updated Name' }

      // Mock system role check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: roleId, is_system_role: true },
        error: null
      })

      await expect(
        roleService.updateRole(tenantId, roleId, updates)
      ).rejects.toThrow('Cannot modify system roles')
    })
  })

  describe('deleteRole', () => {
    it('should delete a role successfully', async () => {
      const tenantId = 'tenant-123'
      const roleId = 'role-456'

      // Mock role existence check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: roleId, is_system_role: false, name: 'test_role' },
        error: null
      })

      // Mock no active user assignments
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null
      })

      // Mock no child roles
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null
      })

      // Mock successful deletion
      mockSupabase.delete.mockResolvedValueOnce({
        error: null
      })

      const result = await roleService.deleteRole(tenantId, roleId)

      expect(result).toBe(true)
    })

    it('should throw error when trying to delete system role', async () => {
      const tenantId = 'tenant-123'
      const roleId = 'system-role-456'

      // Mock system role check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: roleId, is_system_role: true, name: 'system_role' },
        error: null
      })

      await expect(
        roleService.deleteRole(tenantId, roleId)
      ).rejects.toThrow('Cannot delete system roles')
    })

    it('should throw error when role has active users', async () => {
      const tenantId = 'tenant-123'
      const roleId = 'role-456'

      // Mock role existence check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: roleId, is_system_role: false, name: 'test_role' },
        error: null
      })

      // Mock active user assignments exist
      mockSupabase.limit.mockResolvedValueOnce({
        data: [{ id: 'assignment-1' }],
        error: null
      })

      await expect(
        roleService.deleteRole(tenantId, roleId)
      ).rejects.toThrow('Cannot delete role with active user assignments')
    })
  })

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      const tenantId = 'tenant-123'
      const request = {
        user_id: 'user-123',
        role_id: 'role-456'
      }
      const assignedBy = 'admin-123'

      // Mock role validation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: request.role_id, max_users: null, is_active: true },
        error: null
      })

      // Mock user validation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: request.user_id },
        error: null
      })

      // Mock role assignment
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'assignment-789',
        error: null
      })

      // Mock assignment retrieval
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'assignment-789',
          tenant_id: tenantId,
          user_id: request.user_id,
          role_id: request.role_id,
          assigned_by: assignedBy,
          is_active: true
        },
        error: null
      })

      const result = await roleService.assignRoleToUser(tenantId, request, assignedBy)

      expect(result).toBeDefined()
      expect(result.user_id).toBe(request.user_id)
      expect(result.role_id).toBe(request.role_id)
    })

    it('should throw error if role not found', async () => {
      const tenantId = 'tenant-123'
      const request = {
        user_id: 'user-123',
        role_id: 'nonexistent-role'
      }
      const assignedBy = 'admin-123'

      // Mock role not found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null
      })

      await expect(
        roleService.assignRoleToUser(tenantId, request, assignedBy)
      ).rejects.toThrow('Role not found')
    })
  })

  describe('revokeRoleFromUser', () => {
    it('should revoke role from user successfully', async () => {
      const tenantId = 'tenant-123'
      const request = {
        user_id: 'user-123',
        role_id: 'role-456',
        reason: 'User left department'
      }
      const revokedBy = 'admin-123'

      // Mock successful revocation
      mockSupabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null
      })

      const result = await roleService.revokeRoleFromUser(tenantId, request, revokedBy)

      expect(result).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('revoke_role_from_user', {
        p_tenant_id: tenantId,
        p_user_id: request.user_id,
        p_role_id: request.role_id,
        p_reason: request.reason,
        p_revoked_by: revokedBy
      })
    })
  })

  describe('getRoles', () => {
    it('should get all active roles for tenant', async () => {
      const tenantId = 'tenant-123'
      const mockRoles = [
        {
          id: 'role-1',
          name: 'admin',
          display_name: 'Administrator',
          level: 0,
          is_active: true
        },
        {
          id: 'role-2',
          name: 'user',
          display_name: 'User',
          level: 1,
          is_active: true
        }
      ]

      mockSupabase.order.mockResolvedValueOnce({
        data: mockRoles,
        error: null
      })

      const result = await roleService.getRoles(tenantId)

      expect(result).toEqual(mockRoles)
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenantId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('should include inactive roles when requested', async () => {
      const tenantId = 'tenant-123'
      const includeInactive = true

      await roleService.getRoles(tenantId, includeInactive)

      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', tenantId)
      // Should not filter by is_active when including inactive
      expect(mockSupabase.eq).not.toHaveBeenCalledWith('is_active', true)
    })
  })

  describe('getUserRoles', () => {
    it('should get all roles for a user', async () => {
      const tenantId = 'tenant-123'
      const userId = 'user-123'
      const mockUserRoles = [
        {
          assigned_at: new Date().toISOString(),
          expires_at: null,
          assigned_by: 'admin-123',
          roles: {
            id: 'role-1',
            name: 'admin',
            display_name: 'Administrator',
            level: 0,
            is_active: true
          }
        }
      ]

      mockSupabase.order.mockResolvedValueOnce({
        data: mockUserRoles,
        error: null
      })

      const result = await roleService.getUserRoles(tenantId, userId)

      expect(result).toBeDefined()
      expect(result.length).toBe(1)
      expect(result[0].name).toBe('admin')
    })
  })
})

describe('PermissionService', () => {
  let permissionService: PermissionService
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      rpc: jest.fn().mockReturnThis()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    permissionService = new PermissionService()
  })

  describe('checkPermission', () => {
    it('should grant permission when user has it', async () => {
      const tenantId = 'tenant-123'
      const userId = 'user-123'
      const request = {
        permission_name: 'read:asset'
      }

      // Mock user permissions
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [
          {
            permission_name: 'read:asset',
            resource_type: 'asset',
            action: 'read',
            scope: 'tenant',
            conditions: {},
            resource_filters: {},
            source: 'direct'
          }
        ],
        error: null
      })

      const result = await permissionService.checkPermission(tenantId, userId, request)

      expect(result.granted).toBe(true)
      expect(result.source).toBe('direct')
    })

    it('should deny permission when user does not have it', async () => {
      const tenantId = 'tenant-123'
      const userId = 'user-123'
      const request = {
        permission_name: 'delete:asset'
      }

      // Mock user permissions (empty)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const result = await permissionService.checkPermission(tenantId, userId, request)

      expect(result.granted).toBe(false)
      expect(result.reason).toBe('Permission not found')
    })
  })

  describe('hasPermission', () => {
    it('should return true when user has permission', async () => {
      const tenantId = 'tenant-123'
      const userId = 'user-123'
      const permissionName = 'read:asset'

      mockSupabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null
      })

      const result = await permissionService.hasPermission(
        tenantId,
        userId,
        permissionName
      )

      expect(result).toBe(true)
    })

    it('should return false when user does not have permission', async () => {
      const tenantId = 'tenant-123'
      const userId = 'user-123'
      const permissionName = 'delete:asset'

      mockSupabase.rpc.mockResolvedValueOnce({
        data: false,
        error: null
      })

      const result = await permissionService.hasPermission(
        tenantId,
        userId,
        permissionName
      )

      expect(result).toBe(false)
    })
  })

  describe('getUserPermissions', () => {
    it('should return all user permissions including inherited', async () => {
      const tenantId = 'tenant-123'
      const userId = 'user-123'
      const mockPermissions = [
        {
          permission_name: 'read:asset',
          resource_type: 'asset',
          action: 'read',
          scope: 'tenant',
          conditions: {},
          resource_filters: {},
          source: 'direct'
        },
        {
          permission_name: 'create:asset',
          resource_type: 'asset',
          action: 'create',
          scope: 'tenant',
          conditions: {},
          resource_filters: {},
          source: 'inherited'
        }
      ]

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockPermissions,
        error: null
      })

      const result = await permissionService.getUserPermissions(tenantId, userId, false)

      expect(result).toEqual(mockPermissions)
      expect(result.length).toBe(2)
      expect(result.some(p => p.source === 'direct')).toBe(true)
      expect(result.some(p => p.source === 'inherited')).toBe(true)
    })
  })
})