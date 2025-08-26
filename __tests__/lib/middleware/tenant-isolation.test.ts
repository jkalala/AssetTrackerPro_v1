import { 
  TenantIsolationManager, 
  TenantIsolationError,
  withTenantIsolation,
  withTenantRole,
  withResourceAccess
} from '@/lib/middleware/tenant-isolation'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// Mock dependencies
jest.mock('next/headers', () => ({
  headers: jest.fn()
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

const mockHeaders = {
  get: jest.fn()
}

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  rpc: jest.fn()
}

describe('TenantIsolationManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(headers as jest.Mock).mockResolvedValue(mockHeaders)
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('getTenantContext', () => {
    it('should return tenant context from headers', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'admin'
          case 'x-user-permissions': return '{"assets":{"read":true,"write":true}}'
          default: return null
        }
      })

      const context = await TenantIsolationManager.getTenantContext()

      expect(context).toEqual({
        tenantId: 'tenant-123',
        userId: 'user-123',
        role: 'admin',
        permissions: { assets: { read: true, write: true } }
      })
    })

    it('should return null when required headers are missing', async () => {
      mockHeaders.get.mockReturnValue(null)

      const context = await TenantIsolationManager.getTenantContext()

      expect(context).toBeNull()
    })

    it('should handle malformed permissions JSON', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'admin'
          case 'x-user-permissions': return 'invalid-json'
          default: return null
        }
      })

      const context = await TenantIsolationManager.getTenantContext()

      expect(context).toBeNull()
    })
  })

  describe('validateTenantAccess', () => {
    it('should validate tenant access successfully', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'admin'
          case 'x-user-permissions': return '{}'
          default: return null
        }
      })

      const context = await TenantIsolationManager.validateTenantAccess('tenant-123')

      expect(context.tenantId).toBe('tenant-123')
      expect(context.userId).toBe('user-123')
      expect(context.role).toBe('admin')
    })

    it('should throw error when tenant context is missing', async () => {
      mockHeaders.get.mockReturnValue(null)

      await expect(TenantIsolationManager.validateTenantAccess())
        .rejects.toThrow(new TenantIsolationError('Tenant context required', 401))
    })

    it('should throw error when accessing different tenant', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'admin'
          case 'x-user-permissions': return '{}'
          default: return null
        }
      })

      await expect(TenantIsolationManager.validateTenantAccess('tenant-456'))
        .rejects.toThrow(new TenantIsolationError('Unauthorized access to tenant data', 403))
    })
  })

  describe('createTenantQuery', () => {
    it('should create tenant-scoped query', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'admin'
          case 'x-user-permissions': return '{}'
          default: return null
        }
      })

      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      await TenantIsolationManager.createTenantQuery('assets')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('set_current_user_context', {
        user_id: 'user-123',
        tenant_id: 'tenant-123'
      })
      expect(mockSupabase.from).toHaveBeenCalledWith('assets')
    })

    it('should throw error when tenant context is missing', async () => {
      mockHeaders.get.mockReturnValue(null)

      await expect(TenantIsolationManager.createTenantQuery('assets'))
        .rejects.toThrow(new TenantIsolationError('Tenant context required for database operations', 401))
    })
  })

  describe('validateResourceAccess', () => {
    it('should validate resource access successfully', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'admin'
          case 'x-user-permissions': return '{}'
          default: return null
        }
      })

      mockSupabase.single.mockResolvedValue({
        data: { tenant_id: 'tenant-123' },
        error: null
      })

      await expect(TenantIsolationManager.validateResourceAccess('assets', 'asset-123'))
        .resolves.not.toThrow()

      expect(mockSupabase.from).toHaveBeenCalledWith('assets')
      expect(mockSupabase.select).toHaveBeenCalledWith('tenant_id')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'asset-123')
    })

    it('should throw error when resource not found', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'admin'
          case 'x-user-permissions': return '{}'
          default: return null
        }
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      })

      await expect(TenantIsolationManager.validateResourceAccess('assets', 'nonexistent'))
        .rejects.toThrow(new TenantIsolationError('Resource not found', 404))
    })

    it('should throw error when resource belongs to different tenant', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'admin'
          case 'x-user-permissions': return '{}'
          default: return null
        }
      })

      mockSupabase.single.mockResolvedValue({
        data: { tenant_id: 'tenant-456' },
        error: null
      })

      await expect(TenantIsolationManager.validateResourceAccess('assets', 'asset-123'))
        .rejects.toThrow(new TenantIsolationError('Unauthorized access to resource', 403))
    })
  })

  describe('filterTenantData', () => {
    it('should filter data to current tenant only', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'admin'
          case 'x-user-permissions': return '{}'
          default: return null
        }
      })

      const data = [
        { id: '1', tenant_id: 'tenant-123', name: 'Asset 1' },
        { id: '2', tenant_id: 'tenant-456', name: 'Asset 2' },
        { id: '3', tenant_id: 'tenant-123', name: 'Asset 3' }
      ]

      const filtered = await TenantIsolationManager.filterTenantData(data)

      expect(filtered).toHaveLength(2)
      expect(filtered[0].id).toBe('1')
      expect(filtered[1].id).toBe('3')
    })

    it('should return empty array when no tenant context', async () => {
      mockHeaders.get.mockReturnValue(null)

      const data = [
        { id: '1', tenant_id: 'tenant-123', name: 'Asset 1' }
      ]

      const filtered = await TenantIsolationManager.filterTenantData(data)

      expect(filtered).toHaveLength(0)
    })
  })

  describe('addTenantContext', () => {
    it('should add tenant ID to data', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'admin'
          case 'x-user-permissions': return '{}'
          default: return null
        }
      })

      const data = { name: 'New Asset', description: 'Test asset' }

      const result = await TenantIsolationManager.addTenantContext(data)

      expect(result).toEqual({
        name: 'New Asset',
        description: 'Test asset',
        tenant_id: 'tenant-123'
      })
    })

    it('should throw error when no tenant context', async () => {
      mockHeaders.get.mockReturnValue(null)

      const data = { name: 'New Asset' }

      await expect(TenantIsolationManager.addTenantContext(data))
        .rejects.toThrow(new TenantIsolationError('Tenant context required for data creation', 401))
    })
  })

  describe('validateRole', () => {
    it('should allow access for owner role', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'owner'
          case 'x-user-permissions': return '{}'
          default: return null
        }
      })

      await expect(TenantIsolationManager.validateRole('user'))
        .resolves.not.toThrow()
    })

    it('should allow access for admin role', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'admin'
          case 'x-user-permissions': return '{}'
          default: return null
        }
      })

      await expect(TenantIsolationManager.validateRole('user'))
        .resolves.not.toThrow()
    })

    it('should allow access for matching role', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'manager'
          case 'x-user-permissions': return '{}'
          default: return null
        }
      })

      await expect(TenantIsolationManager.validateRole(['manager', 'admin']))
        .resolves.not.toThrow()
    })

    it('should throw error for insufficient role', async () => {
      mockHeaders.get.mockImplementation((header: string) => {
        switch (header) {
          case 'x-tenant-id': return 'tenant-123'
          case 'x-user-id': return 'user-123'
          case 'x-user-role': return 'user'
          case 'x-user-permissions': return '{}'
          default: return null
        }
      })

      await expect(TenantIsolationManager.validateRole('admin'))
        .rejects.toThrow(new TenantIsolationError('Insufficient permissions. Required: admin', 403))
    })

    it('should throw error when no tenant context', async () => {
      mockHeaders.get.mockReturnValue(null)

      await expect(TenantIsolationManager.validateRole('admin'))
        .rejects.toThrow(new TenantIsolationError('Authentication required', 401))
    })
  })
})

describe('withTenantIsolation decorator', () => {
  it('should call handler with tenant context', async () => {
    mockHeaders.get.mockImplementation((header: string) => {
      switch (header) {
        case 'x-tenant-id': return 'tenant-123'
        case 'x-user-id': return 'user-123'
        case 'x-user-role': return 'admin'
        case 'x-user-permissions': return '{}'
        default: return null
      }
    })

    const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }))
    const wrappedHandler = withTenantIsolation(mockHandler)

    const request = new NextRequest('http://localhost/api/test')
    await wrappedHandler(request)

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-123',
        userId: 'user-123',
        role: 'admin'
      }),
      request
    )
  })

  it('should return error response for tenant isolation error', async () => {
    mockHeaders.get.mockReturnValue(null)

    const mockHandler = jest.fn()
    const wrappedHandler = withTenantIsolation(mockHandler)

    const request = new NextRequest('http://localhost/api/test')
    const response = await wrappedHandler(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Tenant context required')
    expect(mockHandler).not.toHaveBeenCalled()
  })
})

describe('withTenantRole decorator', () => {
  it('should validate role before calling handler', async () => {
    mockHeaders.get.mockImplementation((header: string) => {
      switch (header) {
        case 'x-tenant-id': return 'tenant-123'
        case 'x-user-id': return 'user-123'
        case 'x-user-role': return 'admin'
        case 'x-user-permissions': return '{}'
        default: return null
      }
    })

    const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }))
    const wrappedHandler = withTenantRole('admin')(mockHandler)

    const request = new NextRequest('http://localhost/api/test')
    await wrappedHandler(request)

    expect(mockHandler).toHaveBeenCalled()
  })

  it('should return error for insufficient role', async () => {
    mockHeaders.get.mockImplementation((header: string) => {
      switch (header) {
        case 'x-tenant-id': return 'tenant-123'
        case 'x-user-id': return 'user-123'
        case 'x-user-role': return 'user'
        case 'x-user-permissions': return '{}'
        default: return null
      }
    })

    const mockHandler = jest.fn()
    const wrappedHandler = withTenantRole('admin')(mockHandler)

    const request = new NextRequest('http://localhost/api/test')
    const response = await wrappedHandler(request)

    expect(response.status).toBe(403)
    expect(mockHandler).not.toHaveBeenCalled()
  })
})

describe('withResourceAccess decorator', () => {
  it('should validate resource access before calling handler', async () => {
    mockHeaders.get.mockImplementation((header: string) => {
      switch (header) {
        case 'x-tenant-id': return 'tenant-123'
        case 'x-user-id': return 'user-123'
        case 'x-user-role': return 'admin'
        case 'x-user-permissions': return '{}'
        default: return null
      }
    })

    mockSupabase.single.mockResolvedValue({
      data: { tenant_id: 'tenant-123' },
      error: null
    })

    const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }))
    const wrappedHandler = withResourceAccess('assets', 'id')(mockHandler)

    const request = new NextRequest('http://localhost/api/assets?id=asset-123')
    await wrappedHandler(request, { params: { id: 'asset-123' } })

    expect(mockHandler).toHaveBeenCalled()
  })

  it('should return error for unauthorized resource access', async () => {
    mockHeaders.get.mockImplementation((header: string) => {
      switch (header) {
        case 'x-tenant-id': return 'tenant-123'
        case 'x-user-id': return 'user-123'
        case 'x-user-role': return 'admin'
        case 'x-user-permissions': return '{}'
        default: return null
      }
    })

    mockSupabase.single.mockResolvedValue({
      data: { tenant_id: 'tenant-456' },
      error: null
    })

    const mockHandler = jest.fn()
    const wrappedHandler = withResourceAccess('assets', 'id')(mockHandler)

    const request = new NextRequest('http://localhost/api/assets?id=asset-123')
    const response = await wrappedHandler(request, { params: { id: 'asset-123' } })

    expect(response.status).toBe(403)
    expect(mockHandler).not.toHaveBeenCalled()
  })
})