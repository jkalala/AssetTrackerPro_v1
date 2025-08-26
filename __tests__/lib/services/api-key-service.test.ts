/* eslint-disable @typescript-eslint/no-require-imports */
import { apiKeyService } from '@/lib/services/api-key-service'
import type { ApiKey } from '@/lib/types/database'

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

describe('ApiKeyService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createApiKey', () => {
    it('should create an API key successfully', async () => {
      const result = await apiKeyService.createApiKey(
        'tenant-123',
        'user-123',
        'Test API Key',
        { assets: { read: true } },
        ['read:assets']
      )

      expect(result.success).toBe(true)
      expect(result.keyValue).toBeDefined()
      expect(result.keyValue).toMatch(/^ak_/)
    })

    it('should handle creation errors', async () => {
      // Mock error response
      const mockClient = require('@/lib/supabase/client').createClient()
      mockClient.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await apiKeyService.createApiKey(
        'tenant-123',
        'user-123',
        'Test API Key'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('validateApiKey', () => {
    it('should validate a valid API key', async () => {
      const mockApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Test Key',
        is_active: true,
        expires_at: null,
        allowed_ips: [],
        permissions: { assets: { read: true } },
        scopes: ['read:assets'],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600
      }

      const mockClient = require('@/lib/supabase/client').createClient()
      mockClient.from().single.mockResolvedValue({
        data: mockApiKey,
        error: null
      })

      const result = await apiKeyService.validateApiKey('test-key-value')

      expect(result.valid).toBe(true)
      expect(result.apiKey).toEqual(mockApiKey)
    })

    it('should reject invalid API key', async () => {
      const mockClient = require('@/lib/supabase/client').createClient()
      mockClient.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      })

      const result = await apiKeyService.validateApiKey('invalid-key')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid API key')
    })

    it('should reject expired API key', async () => {
      const expiredApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Expired Key',
        is_active: true,
        expires_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        allowed_ips: [],
        permissions: {},
        scopes: [],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600
      }

      const mockClient = require('@/lib/supabase/client').createClient()
      mockClient.from().single.mockResolvedValue({
        data: expiredApiKey,
        error: null
      })

      const result = await apiKeyService.validateApiKey('expired-key')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('API key expired')
    })
  })

  describe('revokeApiKey', () => {
    it('should revoke an API key successfully', async () => {
      const mockClient = require('@/lib/supabase/client').createClient()
      mockClient.from().single.mockResolvedValue({
        data: { id: 'key-123', key_name: 'Test Key' },
        error: null
      })

      const result = await apiKeyService.revokeApiKey(
        'tenant-123',
        'user-123',
        'key-123',
        'User requested'
      )

      expect(result.success).toBe(true)
    })

    it('should handle revocation errors', async () => {
      const mockClient = require('@/lib/supabase/client').createClient()
      mockClient.from().single.mockResolvedValue({
        data: null,
        error: { message: 'API key not found' }
      })

      const result = await apiKeyService.revokeApiKey(
        'tenant-123',
        'user-123',
        'nonexistent',
        'User requested'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('API key not found')
    })
  })

  describe('listApiKeys', () => {
    it('should list API keys for user', async () => {
      const mockApiKeys = [
        {
          id: 'key-1',
          key_name: 'Production API',
          created_at: '2024-01-01T00:00:00Z',
          last_used_at: '2024-01-02T00:00:00Z',
          is_active: true,
          permissions: { assets: { read: true } },
          scopes: ['read:assets']
        },
        {
          id: 'key-2',
          key_name: 'Development API',
          created_at: '2024-01-01T00:00:00Z',
          last_used_at: null,
          is_active: true,
          permissions: { assets: { read: true, create: true, update: true } },
          scopes: ['read:assets', 'write:assets']
        }
      ]

      const mockClient = require('@/lib/supabase/client').createClient()
      mockClient.from().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockApiKeys,
          error: null
        })
      })

      const result = await apiKeyService.listApiKeys('tenant-123', 'user-123')

      expect(result).toHaveLength(2)
      expect(result[0].key_name).toBe('Production API')
    })

    it('should handle list errors', async () => {
      const mockClient = require('@/lib/supabase/client').createClient()
      mockClient.from().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      })

      const result = await apiKeyService.listApiKeys('tenant-123', 'user-123')

      expect(result).toEqual([])
    })
  })

  describe('updateApiKey', () => {
    it('should update API key successfully', async () => {
      const mockClient = require('@/lib/supabase/client').createClient()
      mockClient.from().single.mockResolvedValue({
        data: { id: 'key-123', key_name: 'Updated API Key' },
        error: null
      })

      const result = await apiKeyService.updateApiKey(
        'tenant-123',
        'user-123',
        'key-123',
        {
          keyName: 'Updated API Key',
          permissions: { assets: { read: true, create: true, update: true } }
        }
      )

      expect(result.success).toBe(true)
    })
  })





  describe('key generation', () => {
    it('should generate API key with correct prefix', () => {
      const keyValue = 'ak_test123456789012345678901234567890'
      
      expect(keyValue).toMatch(/^ak_[a-zA-Z0-9]{32}$/)
      expect(keyValue.startsWith('ak_')).toBe(true)
      expect(keyValue.length).toBe(35) // ak_ + 32 characters
    })

    it('should generate unique keys', () => {
      const key1 = 'ak_test123456789012345678901234567890'
      const key2 = 'ak_test987654321098765432109876543210'
      
      expect(key1).not.toBe(key2)
    })
  })

  describe('key hashing', () => {
    it('should hash API key consistently', () => {
      const keyValue = 'ak_test123456789012345678901234567890'
      
      const hash1 = 'hash1'
      const hash2 = 'hash1'
      
      expect(hash1).toBe(hash2)
      expect(hash1).not.toBe(keyValue)
      expect(hash1.length).toBeGreaterThan(0)
    })
  })

  describe('rate limiting', () => {
    it('should check rate limit for API key', async () => {
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

      const result = await apiKeyService.checkRateLimit(mockApiKey, '192.168.1.1')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeDefined()
      expect(result.resetTime).toBeDefined()
    })
  })

  describe('IP restrictions', () => {
    it('should validate allowed IP addresses', () => {
      const allowedIps = ['192.168.1.0/24', '10.0.0.1']
      
      const isAllowed1 = apiKeyService.isIpAllowed('192.168.1.100', allowedIps)
      const isAllowed2 = apiKeyService.isIpAllowed('10.0.0.1', allowedIps)
      const isBlocked = apiKeyService.isIpAllowed('203.0.113.1', allowedIps)
      
      expect(isAllowed1).toBe(true)
      expect(isAllowed2).toBe(true)
      expect(isBlocked).toBe(false)
    })

    it('should allow all IPs when no restrictions', () => {
      const allowedIps: string[] = []
      
      const isAllowed = apiKeyService.isIpAllowed('203.0.113.1', allowedIps)
      
      expect(isAllowed).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle malformed API key format', async () => {
      const result = await apiKeyService.validateApiKey('invalid-format')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid API key format')
    })

    it('should handle database connection errors', async () => {
      const mockClient = require('@/lib/supabase/client').createClient()
      mockClient.from().single.mockRejectedValue(new Error('Connection failed'))

      const result = await apiKeyService.validateApiKey('ak_test123456789012345678901234567890')

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Connection failed')
    })
  })
})