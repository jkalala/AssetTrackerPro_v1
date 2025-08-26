// =====================================================
// PERMISSION ENFORCEMENT TESTS
// =====================================================
// Tests for permission enforcement middleware and utilities

import { NextRequest } from 'next/server'
import { RoleValidationMiddleware, PERMISSIONS } from '@/lib/middleware/role-validation'
import { PermissionService } from '@/lib/services/permission-service'
import { globalPermissionCache } from '@/lib/utils/permission-cache'
import { DataPermissionFilter, filterAssetsByPermissions, globalDataFilter } from '@/lib/utils/data-permission-filters'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockReturnThis()
  }))
}))

jest.mock('@/lib/services/permission-service')

describe('RoleValidationMiddleware', () => {
  let middleware: RoleValidationMiddleware
  let mockPermissionService: jest.Mocked<PermissionService>

  beforeEach(() => {
    middleware = new RoleValidationMiddleware()
    mockPermissionService = new PermissionService() as jest.Mocked<PermissionService>
    ;(middleware as unknown as { permissionService: jest.Mocked<PermissionService> }).permissionService = mockPermissionService
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('validateApiRoute', () => {
    it('should validate permissions successfully', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/api/assets' },
        method: 'GET',
        headers: new Map([['user-agent', 'test-agent']])
      } as unknown as NextRequest

      // Mock user context extraction
      ;(middleware as unknown as { extractUserContext: jest.Mock }).extractUserContext = jest.fn().mockResolvedValue({
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'admin',
        sessionId: 'session-123',
        email: 'test@example.com'
      })

      // Mock permission check
      mockPermissionService.checkMultiplePermissions.mockResolvedValue({
        'read:asset': {
          granted: true,
          source: 'direct'
        }
      })

      const result = await middleware.validateApiRoute(
        mockRequest,
        [PERMISSIONS.ASSETS.READ]
      )

      expect(result.valid).toBe(true)
      expect(result.userContext).toBeDefined()
      expect(result.permissionResults).toBeDefined()
    })

    it('should deny access when user lacks permissions', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/api/assets' },
        method: 'DELETE',
        headers: new Map()
      } as unknown as NextRequest

      ;(middleware as unknown as { extractUserContext: jest.Mock }).extractUserContext = jest.fn().mockResolvedValue({
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'user',
        sessionId: 'session-123',
        email: 'test@example.com'
      })

      mockPermissionService.checkMultiplePermissions.mockResolvedValue({
        'delete:asset': {
          granted: false,
          reason: 'Permission not found'
        }
      })

      const result = await middleware.validateApiRoute(
        mockRequest,
        [PERMISSIONS.ASSETS.DELETE]
      )

      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Missing required permissions')
    })

    it('should handle unauthenticated users', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/api/assets' },
        method: 'GET',
        headers: new Map()
      } as unknown as NextRequest

      ;(middleware as unknown as { extractUserContext: jest.Mock }).extractUserContext = jest.fn().mockResolvedValue(null)

      const result = await middleware.validateApiRoute(
        mockRequest,
        [PERMISSIONS.ASSETS.READ]
      )

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('User not authenticated')
    })

    it('should handle OR logic for multiple permissions', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/api/assets' },
        method: 'POST',
        headers: new Map()
      } as unknown as NextRequest

      ;(middleware as unknown as { extractUserContext: jest.Mock }).extractUserContext = jest.fn().mockResolvedValue({
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'manager',
        sessionId: 'session-123',
        email: 'test@example.com'
      })

      mockPermissionService.checkMultiplePermissions.mockResolvedValue({
        'create:asset': {
          granted: false,
          reason: 'Permission not found'
        },
        'manage:asset': {
          granted: true,
          source: 'inherited'
        }
      })

      const result = await middleware.validateApiRoute(
        mockRequest,
        [PERMISSIONS.ASSETS.CREATE, PERMISSIONS.ASSETS.MANAGE],
        { requireAllPermissions: false }
      )

      expect(result.valid).toBe(true)
    })

    it('should handle AND logic for multiple permissions', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/api/assets/transfer' },
        method: 'POST',
        headers: new Map()
      } as unknown as NextRequest

      ;(middleware as unknown as { extractUserContext: jest.Mock }).extractUserContext = jest.fn().mockResolvedValue({
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'manager',
        sessionId: 'session-123',
        email: 'test@example.com'
      })

      mockPermissionService.checkMultiplePermissions.mockResolvedValue({
        'update:asset': {
          granted: true,
          source: 'direct'
        },
        'transfer:asset': {
          granted: false,
          reason: 'Permission not found'
        }
      })

      const result = await middleware.validateApiRoute(
        mockRequest,
        [PERMISSIONS.ASSETS.UPDATE, PERMISSIONS.ASSETS.TRANSFER],
        { requireAllPermissions: true }
      )

      expect(result.valid).toBe(false)
      expect(result.reason).toContain('transfer:asset')
    })
  })

  describe('resource extraction', () => {
    it('should extract resource ID from URL', async () => {
      const mockRequest = {
        nextUrl: { pathname: '/api/assets/asset-123' },
        method: 'GET',
        headers: new Map()
      } as unknown as NextRequest

      ;(middleware as unknown as { extractUserContext: jest.Mock }).extractUserContext = jest.fn().mockResolvedValue({
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'user',
        sessionId: 'session-123',
        email: 'test@example.com'
      })

      mockPermissionService.checkMultiplePermissions.mockResolvedValue({
        'read:asset': {
          granted: true,
          source: 'direct'
        }
      })

      const resourceExtractor = (req: NextRequest) => {
        const pathParts = req.nextUrl.pathname.split('/')
        return pathParts[pathParts.length - 1]
      }

      const result = await middleware.validateApiRoute(
        mockRequest,
        [PERMISSIONS.ASSETS.READ],
        { resourceIdExtractor: resourceExtractor }
      )

      expect(result.valid).toBe(true)
      expect(mockPermissionService.checkMultiplePermissions).toHaveBeenCalledWith(
        'tenant-123',
        'user-123',
        expect.arrayContaining([
          expect.objectContaining({
            resource_id: 'asset-123'
          })
        ])
      )
    })
  })
})

describe('PermissionCache', () => {
  beforeEach(() => {
    globalPermissionCache.clearAll()
  })

  afterEach(() => {
    globalPermissionCache.clearAll()
  })

  it('should cache and retrieve user permissions', () => {
    const tenantId = 'tenant-123'
    const userId = 'user-123'
    const permissions = [
      {
        permission_name: 'read:asset',
        resource_type: 'asset' as const,
        action: 'read' as const,
        scope: 'tenant' as const,
        conditions: {},
        resource_filters: {},
        source: 'direct' as const
      }
    ]

    // Set permissions in cache
    globalPermissionCache.setUserPermissions(tenantId, userId, permissions)

    // Retrieve from cache
    const cached = globalPermissionCache.getUserPermissions(tenantId, userId)

    expect(cached).toEqual(permissions)
  })

  it('should cache and retrieve permission checks', () => {
    const tenantId = 'tenant-123'
    const userId = 'user-123'
    const permissionName = 'read:asset'
    const granted = true

    // Set permission check in cache
    globalPermissionCache.setPermissionCheck(tenantId, userId, permissionName, granted)

    // Retrieve from cache
    const cached = globalPermissionCache.getPermissionCheck(tenantId, userId, permissionName)

    expect(cached).toBe(granted)
  })

  it('should handle cache expiration', (done) => {
    const tenantId = 'tenant-123'
    const userId = 'user-123'
    const permissions = [
      {
        permission_name: 'read:asset',
        resource_type: 'asset' as const,
        action: 'read' as const,
        scope: 'tenant' as const,
        conditions: {},
        resource_filters: {},
        source: 'direct' as const
      }
    ]

    // Set permissions with very short TTL
    globalPermissionCache.setUserPermissions(tenantId, userId, permissions, 10)

    // Should be available immediately
    expect(globalPermissionCache.getUserPermissions(tenantId, userId)).toEqual(permissions)

    // Should expire after TTL
    setTimeout(() => {
      expect(globalPermissionCache.getUserPermissions(tenantId, userId)).toBeNull()
      done()
    }, 20)
  })

  it('should invalidate user cache', () => {
    const tenantId = 'tenant-123'
    const userId = 'user-123'
    const permissions = [
      {
        permission_name: 'read:asset',
        resource_type: 'asset' as const,
        action: 'read' as const,
        scope: 'tenant' as const,
        conditions: {},
        resource_filters: {},
        source: 'direct' as const
      }
    ]

    globalPermissionCache.setUserPermissions(tenantId, userId, permissions)
    globalPermissionCache.setPermissionCheck(tenantId, userId, 'read:asset', true)

    // Verify cache is populated
    expect(globalPermissionCache.getUserPermissions(tenantId, userId)).toEqual(permissions)
    expect(globalPermissionCache.getPermissionCheck(tenantId, userId, 'read:asset')).toBe(true)

    // Invalidate user cache
    globalPermissionCache.invalidateUser(tenantId, userId)

    // Verify cache is cleared
    expect(globalPermissionCache.getUserPermissions(tenantId, userId)).toBeNull()
    expect(globalPermissionCache.getPermissionCheck(tenantId, userId, 'read:asset')).toBeNull()
  })

  it('should provide cache statistics', () => {
    const tenantId = 'tenant-123'
    const userId = 'user-123'
    const permissions = [
      {
        permission_name: 'read:asset',
        resource_type: 'asset' as const,
        action: 'read' as const,
        scope: 'tenant' as const,
        conditions: {},
        resource_filters: {},
        source: 'direct' as const
      }
    ]

    globalPermissionCache.setUserPermissions(tenantId, userId, permissions)
    globalPermissionCache.setPermissionCheck(tenantId, userId, 'read:asset', true)

    const stats = globalPermissionCache.getStats()

    expect(stats.userPermissions.total).toBe(1)
    expect(stats.permissionChecks.total).toBe(1)
    expect(stats.memoryUsage).toBeDefined()
  })
})

describe('DataPermissionFilter', () => {
  let dataFilter: DataPermissionFilter
  let mockPermissionService: jest.Mocked<PermissionService>

  beforeEach(() => {
    dataFilter = new DataPermissionFilter()
    mockPermissionService = new PermissionService() as jest.Mocked<PermissionService>
    ;(dataFilter as unknown as { permissionService: jest.Mocked<PermissionService> }).permissionService = mockPermissionService
  })

  describe('filterAssets', () => {
    it('should return all assets for users with global permission', async () => {
      const assets = [
        { id: 'asset-1', assignee_id: 'user-1', department: 'IT' },
        { id: 'asset-2', assignee_id: 'user-2', department: 'HR' },
        { id: 'asset-3', assignee_id: 'user-3', department: 'Finance' }
      ]

      mockPermissionService.getUserPermissions.mockResolvedValue([
        {
          permission_name: 'read:asset',
          resource_type: 'asset',
          action: 'read',
          scope: 'tenant',
          conditions: {},
          resource_filters: {},
          source: 'direct'
        }
      ])

      const result = await dataFilter.filterAssets(assets, {
        tenantId: 'tenant-123',
        userId: 'user-123',
        resourceType: 'asset',
        action: 'read'
      })

      expect(result.data).toEqual(assets)
      expect(result.filtered).toBe(false)
      expect(result.totalCount).toBe(3)
      expect(result.filteredCount).toBe(3)
    })

    it('should filter assets for users with personal scope', async () => {
      const assets = [
        { id: 'asset-1', assignee_id: 'user-123', created_by: 'admin' },
        { id: 'asset-2', assignee_id: 'user-456', created_by: 'user-123' },
        { id: 'asset-3', assignee_id: 'user-789', created_by: 'admin' }
      ]

      mockPermissionService.getUserPermissions.mockResolvedValue([
        {
          permission_name: 'read:asset',
          resource_type: 'asset',
          action: 'read',
          scope: 'personal',
          conditions: {},
          resource_filters: {},
          source: 'direct'
        }
      ])

      const result = await dataFilter.filterAssets(assets, {
        tenantId: 'tenant-123',
        userId: 'user-123',
        resourceType: 'asset',
        action: 'read'
      })

      expect(result.data).toHaveLength(2)
      expect(result.data.map(a => a.id)).toEqual(['asset-1', 'asset-2'])
      expect(result.filtered).toBe(true)
      expect(result.totalCount).toBe(3)
      expect(result.filteredCount).toBe(2)
    })

    it('should return empty array for users with no permissions', async () => {
      const assets = [
        { id: 'asset-1', assignee_id: 'user-1' },
        { id: 'asset-2', assignee_id: 'user-2' }
      ]

      mockPermissionService.getUserPermissions.mockResolvedValue([])

      const result = await dataFilter.filterAssets(assets, {
        tenantId: 'tenant-123',
        userId: 'user-123',
        resourceType: 'asset',
        action: 'read'
      })

      expect(result.data).toEqual([])
      expect(result.filtered).toBe(true)
      expect(result.appliedFilters).toContain('no_permission')
    })
  })

  describe('filterUsers', () => {
    it('should filter users by department scope', async () => {
      const users = [
        { id: 'user-1', tenant_id: 'tenant-123', department: 'IT' },
        { id: 'user-2', tenant_id: 'tenant-123', department: 'HR' },
        { id: 'user-3', tenant_id: 'tenant-123', department: 'IT' }
      ]

      mockPermissionService.getUserPermissions.mockResolvedValue([
        {
          permission_name: 'read:user',
          resource_type: 'user',
          action: 'read',
          scope: 'department',
          conditions: {},
          resource_filters: {},
          source: 'direct'
        }
      ])

      // Mock user department lookup
      ;(dataFilter as unknown as { getUserDepartment: jest.Mock }).getUserDepartment = jest.fn().mockResolvedValue('IT')

      const result = await dataFilter.filterUsers(users, {
        tenantId: 'tenant-123',
        userId: 'user-123',
        resourceType: 'user',
        action: 'read'
      })

      expect(result.data).toHaveLength(2)
      expect(result.data.map(u => u.id)).toEqual(['user-1', 'user-3'])
      expect(result.filtered).toBe(true)
    })
  })
})

describe('convenience functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should filter assets by permissions', async () => {
    const assets = [
      { id: 'asset-1', assignee_id: 'user-123', created_by: 'admin' },
      { id: 'asset-2', assignee_id: 'user-456', created_by: 'user-123' }
    ]

    // Mock the global data filter
    const mockFilter = jest.fn().mockResolvedValue({
      data: [assets[0]],
      filtered: true,
      totalCount: 2,
      filteredCount: 1,
      appliedFilters: ['resource_filters']
    })

    ;(globalDataFilter.filterAssets as jest.Mock) = mockFilter

    const result = await filterAssetsByPermissions(
      assets,
      'tenant-123',
      'user-123',
      'read'
    )

    expect(result.data).toHaveLength(1)
    expect(result.filtered).toBe(true)
    expect(mockFilter).toHaveBeenCalledWith(assets, {
      tenantId: 'tenant-123',
      userId: 'user-123',
      resourceType: 'asset',
      action: 'read'
    })
  })
})