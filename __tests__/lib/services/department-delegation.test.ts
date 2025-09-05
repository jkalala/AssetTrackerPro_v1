// =====================================================
// DEPARTMENT AND DELEGATION SERVICES TESTS
// =====================================================
// Tests for department and delegation management services

import { DepartmentService } from '@/lib/services/department-service'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DelegationService } from '@/lib/services/delegation-service'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('DepartmentService', () => {
  let departmentService: DepartmentService
  let mockSupabase: {
    from: jest.Mock
    select: jest.Mock
    insert: jest.Mock
    update: jest.Mock
    delete: jest.Mock
    eq: jest.Mock
    single: jest.Mock
  }

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    departmentService = new DepartmentService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createDepartment', () => {
    it('should create a new department successfully', async () => {
      const tenantId = 'tenant-123'
      const departmentData = {
        name: 'engineering',
        display_name: 'Engineering Department',
        description: 'Software engineering team',
        department_type: 'technical' as const,
      }
      const createdBy = 'user-123'

      // Mock existing department check (no existing department)
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

      // Mock department creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'dept-456',
          tenant_id: tenantId,
          name: departmentData.name,
          display_name: departmentData.display_name,
          description: departmentData.description,
          department_type: departmentData.department_type,
          level: 0,
          is_active: true,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      })

      const result = await departmentService.createDepartment(tenantId, departmentData, createdBy)

      expect(result).toBeDefined()
      expect(result.name).toBe(departmentData.name)
      expect(result.display_name).toBe(departmentData.display_name)
      expect(result.department_type).toBe(departmentData.department_type)
    })

    it('should throw error if department name already exists', async () => {
      const tenantId = 'tenant-123'
      const departmentData = {
        name: 'existing_dept',
        display_name: 'Existing Department',
      }
      const createdBy = 'user-123'

      // Mock existing department check (department exists)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'existing-dept-id' },
        error: null,
      })

      await expect(
        departmentService.createDepartment(tenantId, departmentData, createdBy)
      ).rejects.toThrow("Department with name 'existing_dept' already exists")
    })

    it('should validate parent department exists', async () => {
      const tenantId = 'tenant-123'
      const departmentData = {
        name: 'sub_dept',
        display_name: 'Sub Department',
        parent_department_id: 'nonexistent-parent',
      }
      const createdBy = 'user-123'

      // Mock existing department check (no existing department)
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

      // Mock parent department check (parent not found)
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

      await expect(
        departmentService.createDepartment(tenantId, departmentData, createdBy)
      ).rejects.toThrow('Parent department not found')
    })
  })

  describe('updateDepartment', () => {
    it('should update a department successfully', async () => {
      const tenantId = 'tenant-123'
      const departmentId = 'dept-456'
      const updates = {
        display_name: 'Updated Department Name',
        description: 'Updated description',
      }

      // Mock department existence check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: departmentId, name: 'engineering', code: 'ENG' },
        error: null,
      })

      // Mock department update
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: departmentId,
          tenant_id: tenantId,
          display_name: updates.display_name,
          description: updates.description,
          updated_at: new Date().toISOString(),
        },
        error: null,
      })

      const result = await departmentService.updateDepartment(tenantId, departmentId, updates)

      expect(result).toBeDefined()
      expect(result.display_name).toBe(updates.display_name)
      expect(result.description).toBe(updates.description)
    })

    it('should validate name uniqueness when updating', async () => {
      const tenantId = 'tenant-123'
      const departmentId = 'dept-456'
      const updates = { name: 'existing_name' }

      // Mock department existence check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: departmentId, name: 'old_name', code: 'OLD' },
        error: null,
      })

      // Mock name conflict check (name exists)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'other-dept-id' },
        error: null,
      })

      await expect(
        departmentService.updateDepartment(tenantId, departmentId, updates)
      ).rejects.toThrow("Department with name 'existing_name' already exists")
    })
  })

  describe('deleteDepartment', () => {
    it('should delete a department successfully', async () => {
      const tenantId = 'tenant-123'
      const departmentId = 'dept-456'

      // Mock department existence check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: departmentId, name: 'test_dept' },
        error: null,
      })

      // Mock no assigned users
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      // Mock no child departments
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      // Mock successful deletion
      mockSupabase.delete.mockResolvedValueOnce({
        error: null,
      })

      const result = await departmentService.deleteDepartment(tenantId, departmentId)

      expect(result).toBe(true)
    })

    it('should throw error when department has assigned users', async () => {
      const tenantId = 'tenant-123'
      const departmentId = 'dept-456'

      // Mock department existence check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: departmentId, name: 'test_dept' },
        error: null,
      })

      // Mock assigned users exist
      mockSupabase.limit.mockResolvedValueOnce({
        data: [{ id: 'user-dept-1' }],
        error: null,
      })

      await expect(departmentService.deleteDepartment(tenantId, departmentId)).rejects.toThrow(
        'Cannot delete department with assigned users'
      )
    })
  })

  describe('assignUserToDepartment', () => {
    it('should assign user to department successfully', async () => {
      const tenantId = 'tenant-123'
      const userId = 'user-123'
      const departmentId = 'dept-456'

      // Mock department validation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: departmentId, is_active: true },
        error: null,
      })

      // Mock user validation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: userId },
        error: null,
      })

      // Mock assignment creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'assignment-789',
          tenant_id: tenantId,
          user_id: userId,
          department_id: departmentId,
          is_primary: false,
          assigned_at: new Date().toISOString(),
        },
        error: null,
      })

      const result = await departmentService.assignUserToDepartment(tenantId, userId, departmentId)

      expect(result).toBeDefined()
      expect(result.user_id).toBe(userId)
      expect(result.department_id).toBe(departmentId)
    })

    it('should throw error if department not found', async () => {
      const tenantId = 'tenant-123'
      const userId = 'user-123'
      const departmentId = 'nonexistent-dept'

      // Mock department not found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await expect(
        departmentService.assignUserToDepartment(tenantId, userId, departmentId)
      ).rejects.toThrow('Department not found')
    })
  })

  describe('getDepartmentHierarchy', () => {
    it('should build department hierarchy correctly', async () => {
      const tenantId = 'tenant-123'
      const mockDepartments = [
        {
          id: 'dept-1',
          name: 'root',
          display_name: 'Root Department',
          parent_department_id: null,
          level: 0,
        },
        {
          id: 'dept-2',
          name: 'child',
          display_name: 'Child Department',
          parent_department_id: 'dept-1',
          level: 1,
        },
      ]

      // Mock getDepartments call
      ;(departmentService as any).getDepartments = jest.fn().mockResolvedValue(mockDepartments)

      // Mock user counts
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { department_id: 'dept-1' },
          { department_id: 'dept-1' },
          { department_id: 'dept-2' },
        ],
        error: null,
      })

      // Mock department roles
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ department_id: 'dept-1', roles: { id: 'role-1', name: 'admin' } }],
        error: null,
      })

      const result = await departmentService.getDepartmentHierarchy(tenantId)

      expect(result).toHaveLength(1) // One root department
      expect(result[0].department.id).toBe('dept-1')
      expect(result[0].children).toHaveLength(1) // One child department
      expect(result[0].children[0].department.id).toBe('dept-2')
    })
  })
})

describe('DelegationService', () => {
  let delegationService: DelegationService
  let mockSupabase: {
    from: jest.Mock
    select: jest.Mock
    insert: jest.Mock
    update: jest.Mock
    delete: jest.Mock
    eq: jest.Mock
    single: jest.Mock
  }

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    delegationService = new DelegationService()
  })

  describe('createDelegation', () => {
    it('should create a delegation successfully', async () => {
      const tenantId = 'tenant-123'
      const delegatorId = 'user-123'
      const request = {
        delegatee_id: 'user-456',
        permission_names: ['read:asset', 'update:asset'],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        reason: 'Temporary delegation for project',
      }

      // Mock delegatee validation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: request.delegatee_id, email: 'delegatee@example.com' },
        error: null,
      })

      // Mock permission validation
      ;(delegationService as any).validateDelegatorPermissions = jest.fn().mockResolvedValue(true)

      // Mock permission ID lookup
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ id: 'perm-1' }, { id: 'perm-2' }],
        error: null,
      })

      // Mock delegation creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'delegation-789',
          tenant_id: tenantId,
          delegator_id: delegatorId,
          delegatee_id: request.delegatee_id,
          permission_ids: ['perm-1', 'perm-2'],
          expires_at: request.expires_at,
          reason: request.reason,
          status: 'active',
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const result = await delegationService.createDelegation(tenantId, delegatorId, request)

      expect(result).toBeDefined()
      expect(result.delegator_id).toBe(delegatorId)
      expect(result.delegatee_id).toBe(request.delegatee_id)
      expect(result.status).toBe('active')
    })

    it('should throw error if delegatee not found', async () => {
      const tenantId = 'tenant-123'
      const delegatorId = 'user-123'
      const request = {
        delegatee_id: 'nonexistent-user',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }

      // Mock delegatee not found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await expect(
        delegationService.createDelegation(tenantId, delegatorId, request)
      ).rejects.toThrow('Delegatee not found in tenant')
    })

    it('should validate expiration date', async () => {
      const tenantId = 'tenant-123'
      const delegatorId = 'user-123'
      const request = {
        delegatee_id: 'user-456',
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      }

      // Mock delegatee validation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: request.delegatee_id, email: 'delegatee@example.com' },
        error: null,
      })

      await expect(
        delegationService.createDelegation(tenantId, delegatorId, request)
      ).rejects.toThrow('Expiration date must be in the future')
    })
  })

  describe('revokeDelegation', () => {
    it('should revoke delegation successfully', async () => {
      const tenantId = 'tenant-123'
      const delegationId = 'delegation-789'
      const revokedBy = 'user-123'

      // Mock delegation validation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: delegationId,
          delegator_id: revokedBy,
          status: 'active',
        },
        error: null,
      })

      // Mock revocation update
      mockSupabase.update.mockResolvedValueOnce({
        error: null,
      })

      const result = await delegationService.revokeDelegation(tenantId, delegationId, revokedBy)

      expect(result).toBe(true)
    })

    it('should throw error if user is not the delegator', async () => {
      const tenantId = 'tenant-123'
      const delegationId = 'delegation-789'
      const revokedBy = 'user-456' // Different from delegator

      // Mock delegation validation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: delegationId,
          delegator_id: 'user-123', // Different delegator
          status: 'active',
        },
        error: null,
      })

      await expect(
        delegationService.revokeDelegation(tenantId, delegationId, revokedBy)
      ).rejects.toThrow('Only the delegator can revoke this delegation')
    })
  })

  describe('createGuestAccess', () => {
    it('should create guest access successfully', async () => {
      const tenantId = 'tenant-123'
      const invitedBy = 'user-123'
      const request = {
        email: 'guest@example.com',
        full_name: 'Guest User',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        max_sessions: 3,
      }

      // Mock existing guest check (no existing guest)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Mock guest access creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'guest-789',
          tenant_id: tenantId,
          email: request.email,
          full_name: request.full_name,
          invited_by: invitedBy,
          expires_at: request.expires_at,
          max_sessions: request.max_sessions,
          is_active: true,
          login_count: 0,
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const result = await delegationService.createGuestAccess(tenantId, invitedBy, request)

      expect(result).toBeDefined()
      expect(result.email).toBe(request.email)
      expect(result.invited_by).toBe(invitedBy)
      expect(result.is_active).toBe(true)
    })

    it('should validate email format', async () => {
      const tenantId = 'tenant-123'
      const invitedBy = 'user-123'
      const request = {
        email: 'invalid-email',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      await expect(
        delegationService.createGuestAccess(tenantId, invitedBy, request)
      ).rejects.toThrow('Invalid email format')
    })

    it('should throw error if active guest access already exists', async () => {
      const tenantId = 'tenant-123'
      const invitedBy = 'user-123'
      const request = {
        email: 'existing@example.com',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      // Mock existing guest check (active guest exists)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'existing-guest', is_active: true },
        error: null,
      })

      await expect(
        delegationService.createGuestAccess(tenantId, invitedBy, request)
      ).rejects.toThrow('Active guest access already exists for this email')
    })
  })

  describe('cleanupExpiredDelegations', () => {
    it('should cleanup expired delegations', async () => {
      const tenantId = 'tenant-123'

      // Mock cleanup update
      mockSupabase.update.mockResolvedValueOnce({
        error: null,
        count: 5,
      })

      const result = await delegationService.cleanupExpiredDelegations(tenantId)

      expect(result).toBe(5)
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'expired' })
    })
  })

  describe('getDelegationStats', () => {
    it('should return delegation statistics', async () => {
      const tenantId = 'tenant-123'
      const days = 30

      // Mock delegations data
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { status: 'active', permission_ids: ['perm-1', 'perm-2'] },
          { status: 'expired', permission_ids: ['perm-3'] },
          { status: 'revoked', permission_ids: ['perm-4'] },
        ],
        error: null,
      })

      // Mock guest access data
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ id: 'guest-1' }, { id: 'guest-2' }],
        error: null,
      })

      const result = await delegationService.getDelegationStats(tenantId, days)

      expect(result).toBeDefined()
      expect(result.total_delegations).toBe(3)
      expect(result.active_delegations).toBe(1)
      expect(result.expired_delegations).toBe(1)
      expect(result.revoked_delegations).toBe(1)
      expect(result.guest_access_count).toBe(2)
      expect(result.most_delegated_permissions).toBeDefined()
    })
  })
})
