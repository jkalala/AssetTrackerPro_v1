import { NextRequest } from 'next/server'
import { withApiKeyAuth, requireApiKey } from '@/lib/middleware/api-key-auth'
import { apiKeyService } from '@/lib/services/api-key-service'

// Mock the API key service
jest.mock('@/lib/services/api-key-service', () => ({
  apiKeyService: {
    validateApiKey: jest.fn(),
    logApiKeyUsage: jest.fn(),
  },
}))

describe('API Key Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('withApiKeyAuth', () => {
    it('should return error when no API key is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')

      const result = await withApiKeyAuth(request)

      expect(result.success).toBe(false)
      expect(result.response?.status).toBe(401)
    })

    it('should return error when API key is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': 'Bearer invalid-key'
        }
      })

      ;(apiKeyService.validateApiKey as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid API key'
      })

      const result = await withApiKeyAuth(request)

      expect(result.success).toBe(false)
      expect(result.response?.status).toBe(401)
    })

    it('should return success when API key is valid', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': 'Bearer ak_valid_key'
        }
      })

      const mockApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Test Key'
      }

      ;(apiKeyService.validateApiKey as jest.Mock).mockResolvedValue({
        valid: true,
        apiKey: mockApiKey
      })

      const result = await withApiKeyAuth(request)

      expect(result.success).toBe(true)
      expect(result.context?.apiKey).toEqual(mockApiKey)
      expect(result.context?.tenantId).toBe('tenant-123')
      expect(result.context?.userId).toBe('user-123')
    })

    it('should handle rate limit exceeded', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': 'Bearer ak_rate_limited_key'
        }
      })

      ;(apiKeyService.validateApiKey as jest.Mock).mockResolvedValue({
        valid: false,
        rateLimitExceeded: true,
        error: 'Rate limit exceeded'
      })

      const result = await withApiKeyAuth(request)

      expect(result.success).toBe(false)
      expect(result.response?.status).toBe(429)
    })

    it('should validate required permissions', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': 'Bearer ak_limited_key'
        }
      })

      ;(apiKeyService.validateApiKey as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Insufficient permissions'
      })

      const result = await withApiKeyAuth(request, {
        requiredPermission: 'assets:write'
      })

      expect(result.success).toBe(false)
      expect(result.response?.status).toBe(401)
    })
  })

  describe('requireApiKey', () => {
    it('should wrap handler with API key authentication', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response('Success', { status: 200 })
      )

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': 'Bearer ak_valid_key'
        }
      })

      const mockApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Test Key'
      }

      ;(apiKeyService.validateApiKey as jest.Mock).mockResolvedValue({
        valid: true,
        apiKey: mockApiKey
      })

      const wrappedHandler = requireApiKey(mockHandler)
      const response = await wrappedHandler(request)

      expect(mockHandler).toHaveBeenCalledWith(request, {
        apiKey: mockApiKey,
        tenantId: 'tenant-123',
        userId: 'user-123'
      })
      expect(response.status).toBe(200)
    })

    it('should return 401 when authentication fails', async () => {
      const mockHandler = jest.fn()

      const request = new NextRequest('http://localhost:3000/api/test')

      const wrappedHandler = requireApiKey(mockHandler)
      const response = await wrappedHandler(request)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(401)
    })

    it('should handle handler errors gracefully', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'))

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': 'Bearer ak_valid_key'
        }
      })

      const mockApiKey = {
        id: 'key-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        key_name: 'Test Key'
      }

      ;(apiKeyService.validateApiKey as jest.Mock).mockResolvedValue({
        valid: true,
        apiKey: mockApiKey
      })

      const wrappedHandler = requireApiKey(mockHandler)
      const response = await wrappedHandler(request)

      expect(response.status).toBe(500)
    })
  })

  describe('API key extraction', () => {
    it('should extract API key from Bearer token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': 'Bearer ak_test_key'
        }
      })

      ;(apiKeyService.validateApiKey as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid API key'
      })

      await withApiKeyAuth(request)

      expect(apiKeyService.validateApiKey).toHaveBeenCalledWith(
        'ak_test_key',
        undefined,
        undefined,
        '127.0.0.1'
      )
    })

    it('should extract API key from ApiKey header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': 'ApiKey ak_test_key'
        }
      })

      ;(apiKeyService.validateApiKey as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid API key'
      })

      await withApiKeyAuth(request)

      expect(apiKeyService.validateApiKey).toHaveBeenCalledWith(
        'ak_test_key',
        undefined,
        undefined,
        '127.0.0.1'
      )
    })

    it('should extract direct API key', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': 'ak_test_key'
        }
      })

      ;(apiKeyService.validateApiKey as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid API key'
      })

      await withApiKeyAuth(request)

      expect(apiKeyService.validateApiKey).toHaveBeenCalledWith(
        'ak_test_key',
        undefined,
        undefined,
        '127.0.0.1'
      )
    })

    it('should extract IP from x-forwarded-for header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'authorization': 'Bearer ak_test_key',
          'x-forwarded-for': '192.168.1.100, 10.0.0.1'
        }
      })

      ;(apiKeyService.validateApiKey as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid API key'
      })

      await withApiKeyAuth(request)

      expect(apiKeyService.validateApiKey).toHaveBeenCalledWith(
        'ak_test_key',
        undefined,
        undefined,
        '192.168.1.100'
      )
    })
  })
})