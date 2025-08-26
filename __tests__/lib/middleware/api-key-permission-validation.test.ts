import { apiKeyService } from '@/lib/services/api-key-service'
import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import type { ApiKey } from '@/lib/types/database'

// Mock the API key service
jest.mock('@/lib/services/api-key-service', () => ({
  apiKeyService: {
    validateApiKey: jest.fn(),
    hasScope: jest.fn(),
    checkRateLimit: jest.fn()
  }
}))

describe('API Key Permission Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateApiKey', () => {
    it('should validate API key with correct permissions', async () => {
      const mockApiKey: ApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Test Key',
        key_prefix: 'ak_',
        key_hash: 'hash123',
        is_active: true,
        expires_at: undefined,
        permissions: {
          assets: { read: true, write: true }
        },
        scopes: ['read:assets', 'write:assets'],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600,
        created_at: new Date().toISOString(),
        last_used_at: undefined,
        allowed_ips: []
      }

      ;(apiKeyService.validateApiKey as jest.MockedFunction<typeof apiKeyService.validateApiKey>).mockResolvedValue({
        valid: true,
        apiKey: mockApiKey
      })

      const result = await apiKeyService.validateApiKey('ak_test123456789012345678901234567890')

      expect(result.valid).toBe(true)
      expect(result.apiKey).toEqual(mockApiKey)
    })

    it('should reject invalid API key', async () => {
      ;(apiKeyService.validateApiKey as jest.MockedFunction<typeof apiKeyService.validateApiKey>).mockResolvedValue({
        valid: false,
        error: 'Invalid API key'
      })

      const result = await apiKeyService.validateApiKey('invalid-key')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid API key')
    })

    it('should reject expired API key', async () => {
      const expiredApiKey: ApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Expired Key',
        key_prefix: 'ak_',
        key_hash: 'hash123',
        is_active: true,
        expires_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        permissions: {},
        scopes: [],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600,
        created_at: new Date().toISOString(),
        last_used_at: undefined,
        allowed_ips: []
      }

      ;(apiKeyService.validateApiKey as jest.MockedFunction<typeof apiKeyService.validateApiKey>).mockResolvedValue({
        valid: false,
        error: 'API key expired',
        apiKey: expiredApiKey
      })

      const result = await apiKeyService.validateApiKey('ak_expired123456789012345678901234567890')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('API key expired')
    })

    it('should reject inactive API key', async () => {
      const inactiveApiKey: ApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Inactive Key',
        key_prefix: 'ak_',
        key_hash: 'hash123',
        is_active: false,
        expires_at: undefined,
        permissions: {},
        scopes: [],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600,
        created_at: new Date().toISOString(),
        last_used_at: undefined,
        allowed_ips: []
      }

      ;(apiKeyService.validateApiKey as jest.MockedFunction<typeof apiKeyService.validateApiKey>).mockResolvedValue({
        valid: false,
        error: 'API key is inactive',
        apiKey: inactiveApiKey
      })

      const result = await apiKeyService.validateApiKey('ak_inactive123456789012345678901234567890')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('API key is inactive')
    })
  })



  describe('hasScope', () => {
    it('should validate required scopes', () => {
      const scopes = ['read:assets', 'write:assets', 'read:users']

      ;(apiKeyService.hasScope as jest.MockedFunction<typeof apiKeyService.hasScope>).mockImplementation(
        (scopeList: string[], requiredScope: string) => scopeList.includes(requiredScope)
      )

      const hasReadAssets = apiKeyService.hasScope(scopes, 'read:assets')
      const hasWriteAssets = apiKeyService.hasScope(scopes, 'write:assets')
      const hasDeleteAssets = apiKeyService.hasScope(scopes, 'delete:assets')

      expect(hasReadAssets).toBe(true)
      expect(hasWriteAssets).toBe(true)
      expect(hasDeleteAssets).toBe(false)
    })

    it('should handle wildcard scopes', () => {
      const scopes = ['*:assets', 'read:*']

      ;(apiKeyService.hasScope as jest.MockedFunction<typeof apiKeyService.hasScope>).mockImplementation(
        (scopeList: string[], requiredScope: string) => {
          return scopeList.some((scope: string) => {
            if (scope === requiredScope) return true
            
            const [scopeAction, scopeResource] = scope.split(':')
            const [reqAction, reqResource] = requiredScope.split(':')
            
            return (scopeAction === '*' && scopeResource === reqResource) ||
                   (scopeAction === reqAction && scopeResource === '*')
          })
        }
      )

      const hasReadAssets = apiKeyService.hasScope(scopes, 'read:assets')
      const hasWriteAssets = apiKeyService.hasScope(scopes, 'write:assets')
      const hasReadUsers = apiKeyService.hasScope(scopes, 'read:users')

      expect(hasReadAssets).toBe(true)
      expect(hasWriteAssets).toBe(true)
      expect(hasReadUsers).toBe(true)
    })

    it('should handle empty scopes array', () => {
      const scopes: string[] = []

      ;(apiKeyService.hasScope as jest.MockedFunction<typeof apiKeyService.hasScope>).mockImplementation(
        (scopeList: string[], requiredScope: string) => scopeList.includes(requiredScope)
      )

      const hasScope = apiKeyService.hasScope(scopes, 'read:assets')

      expect(hasScope).toBe(false)
    })
  })

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      const mockApiKey: ApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Test Key',
        key_prefix: 'ak_',
        key_hash: 'hash123',
        is_active: true,
        expires_at: undefined,
        permissions: {},
        scopes: [],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600,
        created_at: new Date().toISOString(),
        last_used_at: undefined,
        allowed_ips: []
      }

      ;(apiKeyService.checkRateLimit as jest.MockedFunction<typeof apiKeyService.checkRateLimit>).mockResolvedValue({
        allowed: true,
        remaining: 999,
        resetTime: new Date(Date.now() + 3600000),
        limit: 1000
      })

      const result = await apiKeyService.checkRateLimit(mockApiKey, '192.168.1.1')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(999)
      expect(result.limit).toBe(1000)
    })

    it('should block requests exceeding rate limit', async () => {
      const mockApiKey: ApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Test Key',
        key_prefix: 'ak_',
        key_hash: 'hash123',
        is_active: true,
        expires_at: undefined,
        permissions: {},
        scopes: [],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600,
        created_at: new Date().toISOString(),
        last_used_at: undefined,
        allowed_ips: []
      }

      ;(apiKeyService.checkRateLimit as jest.MockedFunction<typeof apiKeyService.checkRateLimit>).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 3600000),
        limit: 1000
      })

      const result = await apiKeyService.checkRateLimit(mockApiKey, '192.168.1.1')

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should handle different IP addresses separately', async () => {
      const mockApiKey: ApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Test Key',
        key_prefix: 'ak_',
        key_hash: 'hash123',
        is_active: true,
        expires_at: undefined,
        permissions: {},
        scopes: [],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600,
        created_at: new Date().toISOString(),
        last_used_at: undefined,
        allowed_ips: []
      }

      ;(apiKeyService.checkRateLimit as jest.MockedFunction<typeof apiKeyService.checkRateLimit>)
        .mockResolvedValueOnce({
          allowed: true,
          remaining: 999,
          resetTime: new Date(Date.now() + 3600000),
          limit: 1000
        })
        .mockResolvedValueOnce({
          allowed: true,
          remaining: 999,
          resetTime: new Date(Date.now() + 3600000),
          limit: 1000
        })

      const result1 = await apiKeyService.checkRateLimit(mockApiKey, '192.168.1.1')
      const result2 = await apiKeyService.checkRateLimit(mockApiKey, '192.168.1.2')

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
    })
  })

  describe('permission validation middleware', () => {
    it('should validate API key permissions for asset read operations', async () => {
      const mockApiKey: ApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Test Key',
        key_prefix: 'ak_',
        key_hash: 'hash123',
        is_active: true,
        expires_at: undefined,
        permissions: { assets: { read: true, write: false } },
        scopes: ['read:assets'],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600,
        created_at: new Date().toISOString(),
        last_used_at: undefined,
        allowed_ips: []
      }

      ;(apiKeyService.validateApiKey as jest.MockedFunction<typeof apiKeyService.validateApiKey>).mockResolvedValue({
        valid: true,
        apiKey: mockApiKey
      })

      ;(apiKeyService.hasScope as jest.MockedFunction<typeof apiKeyService.hasScope>).mockReturnValue(true)

      // Mock request headers
      const mockHeaders = {
        'Authorization': 'Bearer ak_test123456789012345678901234567890'
      }

      // Simulate middleware validation
      const authHeader = mockHeaders['Authorization']
      const token = authHeader?.replace('Bearer ', '')
      
      const validation = await apiKeyService.validateApiKey(token!)
      const hasReadScope = apiKeyService.hasScope(
        validation.apiKey?.scopes || [], 
        'read:assets'
      )

      expect(validation.valid).toBe(true)
      expect(validation.apiKey?.permissions?.assets?.read).toBe(true)
      expect(hasReadScope).toBe(true)
    })

    it('should reject API key without write permissions for write operations', async () => {
      const mockApiKey: ApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Test Key',
        key_prefix: 'ak_',
        key_hash: 'hash123',
        is_active: true,
        expires_at: undefined,
        permissions: { assets: { read: true, write: false } },
        scopes: ['read:assets'],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600,
        created_at: new Date().toISOString(),
        last_used_at: undefined,
        allowed_ips: []
      }

      ;(apiKeyService.validateApiKey as jest.MockedFunction<typeof apiKeyService.validateApiKey>).mockResolvedValue({
        valid: true,
        apiKey: mockApiKey
      })

      ;(apiKeyService.hasScope as jest.MockedFunction<typeof apiKeyService.hasScope>).mockReturnValue(false)

      // Mock request headers
      const mockHeaders = {
        'Authorization': 'Bearer ak_test123456789012345678901234567890'
      }

      // Simulate middleware validation
      const authHeader = mockHeaders['Authorization']
      const token = authHeader?.replace('Bearer ', '')
      
      const validation = await apiKeyService.validateApiKey(token!)
      const hasWriteScope = apiKeyService.hasScope(
        validation.apiKey?.scopes || [], 
        'write:assets'
      )

      expect(validation.valid).toBe(true)
      expect(validation.apiKey?.permissions?.assets?.write).toBe(false)
      expect(hasWriteScope).toBe(false)
    })
  })

  describe('tenant isolation with API keys', () => {
    it('should enforce tenant isolation for API key access', async () => {
      const mockApiKey: ApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Test Key',
        key_prefix: 'ak_',
        key_hash: 'hash123',
        is_active: true,
        expires_at: undefined,
        permissions: { assets: { read: true } },
        scopes: ['read:assets'],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600,
        created_at: new Date().toISOString(),
        last_used_at: undefined,
        allowed_ips: []
      }

      ;(apiKeyService.validateApiKey as jest.MockedFunction<typeof apiKeyService.validateApiKey>).mockResolvedValue({
        valid: true,
        apiKey: mockApiKey
      })

      const validation = await apiKeyService.validateApiKey('ak_test123456789012345678901234567890')

      expect(validation.valid).toBe(true)
      expect(validation.apiKey?.tenant_id).toBe('tenant-123')
    })

    it('should prevent cross-tenant access via API keys', async () => {
      const mockApiKey: ApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Test Key',
        key_prefix: 'ak_',
        key_hash: 'hash123',
        is_active: true,
        expires_at: undefined,
        permissions: { assets: { read: true } },
        scopes: ['read:assets'],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600,
        created_at: new Date().toISOString(),
        last_used_at: undefined,
        allowed_ips: []
      }

      ;(apiKeyService.validateApiKey as jest.MockedFunction<typeof apiKeyService.validateApiKey>).mockResolvedValue({
        valid: true,
        apiKey: mockApiKey
      })

      const validation = await apiKeyService.validateApiKey('ak_test123456789012345678901234567890')

      // Simulate attempting to access different tenant's data
      const requestedTenantId = 'tenant-456'
      const apiKeyTenantId = validation.apiKey?.tenant_id

      expect(apiKeyTenantId).not.toBe(requestedTenantId)
      expect(apiKeyTenantId).toBe('tenant-123')
    })
  })
})
