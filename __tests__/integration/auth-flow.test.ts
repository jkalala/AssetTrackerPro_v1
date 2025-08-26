/**
 * Integration tests for authentication flow
 * Tests the complete authentication workflow including API keys, MFA, and sessions
 */

import { apiKeyService } from '@/lib/services/api-key-service'
import { mfaService } from '@/lib/services/mfa-service'
import { sessionService } from '@/lib/services/session-service'
import { createClient } from '@/lib/supabase/client'
import { authenticator } from 'otplib'

// Mock Supabase client for integration tests
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

describe('Authentication Flow Integration', () => {
  const mockTenantId = 'tenant-123'
  const mockUserId = 'user-123'
  const mockUserEmail = 'user@example.com'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete API Key Workflow', () => {
    it('should create, validate, and revoke API key', async () => {
      // Mock successful API key creation
      const mockApiKey = {
        id: 'key-123',
        tenant_id: mockTenantId,
        user_id: mockUserId,
        key_name: 'Integration Test Key',
        key_prefix: 'ak_12345',
        is_active: true,
        permissions: { assets: { read: true, create: true, update: true } },
        scopes: ['read:assets', 'write:assets'],
        allowed_ips: [],
        rate_limit_requests: 1000,
        rate_limit_window_seconds: 3600,
        expires_at: null
      }

      const mockClient = createClient()
      
      // Step 1: Create API key
      mockClient.from().single.mockResolvedValueOnce({
        data: mockApiKey,
        error: null
      })

      const createResult = await apiKeyService.createApiKey(
        mockTenantId,
        mockUserId,
        'Integration Test Key',
        { assets: { read: true, create: true, update: true } },
        ['read:assets', 'write:assets']
      )

      expect(createResult.success).toBe(true)
      expect(createResult.keyValue).toMatch(/^ak_/)
      expect(createResult.apiKey).toEqual(mockApiKey)

      // Step 2: Validate API key
      mockClient.from().single.mockResolvedValueOnce({
        data: mockApiKey,
        error: null
      })

      // Mock rate limit check
      mockClient.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      const validateResult = await apiKeyService.validateApiKey(
        createResult.keyValue!,
        'assets:read'
      )

      expect(validateResult.valid).toBe(true)
      expect(validateResult.apiKey).toEqual(mockApiKey)

      // Step 3: Revoke API key
      mockClient.from().single.mockResolvedValueOnce({
        data: { ...mockApiKey, is_active: false },
        error: null
      })

      const revokeResult = await apiKeyService.revokeApiKey(
        mockTenantId,
        mockUserId,
        mockApiKey.id,
        'Integration test cleanup'
      )

      expect(revokeResult.success).toBe(true)
    })

    it('should handle permission validation correctly', async () => {
      const limitedApiKey = {
        id: 'key-limited',
        tenant_id: mockTenantId,
        user_id: mockUserId,
        key_name: 'Limited Key',
        is_active: true,
        permissions: { assets: { read: true } }, // Only read permission
        scopes: ['read:assets'],
        allowed_ips: [],
        rate_limit_requests: 100,
        rate_limit_window_seconds: 3600,
        expires_at: null
      }

      const mockClient = createClient()
      mockClient.from().single.mockResolvedValue({
        data: limitedApiKey,
        error: null
      })

      // Should succeed for read permission
      const readResult = await apiKeyService.validateApiKey('test-key', 'assets:read')
      expect(readResult.valid).toBe(true)

      // Should fail for write permission
      const writeResult = await apiKeyService.validateApiKey('test-key', 'assets:write')
      expect(writeResult.valid).toBe(false)
      expect(writeResult.error).toBe('Insufficient permissions')
    })
  })

  describe('Complete MFA Workflow', () => {
    it('should setup TOTP, verify code, and manage backup codes', async () => {
      const mockMfaMethod = {
        id: 'mfa-123',
        tenant_id: mockTenantId,
        user_id: mockUserId,
        method_type: 'totp',
        method_name: 'Authenticator App',
        is_verified: false,
        is_primary: false,
        secret_encrypted: 'encrypted_secret',
        backup_codes: ['encrypted_code1', 'encrypted_code2']
      }

      const mockClient = createClient()

      // Step 1: Setup TOTP
      mockClient.from().single.mockResolvedValueOnce({
        data: mockMfaMethod,
        error: null
      })

      const setupResult = await mfaService.setupTOTP(
        mockTenantId,
        mockUserId,
        'Authenticator App',
        mockUserEmail
      )

      expect(setupResult.success).toBe(true)
      expect(setupResult.method).toEqual(mockMfaMethod)
      expect(setupResult.secret).toBeDefined()
      expect(setupResult.qrCode).toBeDefined()
      expect(setupResult.backupCodes).toHaveLength(10)

      // Step 2: Verify setup code
      const verifiedMethod = { ...mockMfaMethod, is_verified: true }
      mockClient.from().single.mockResolvedValueOnce({
        data: verifiedMethod,
        error: null
      })

      const verifyResult = await mfaService.verifyMfaCode(
        mockTenantId,
        mockUserId,
        mockMfaMethod.id,
        '123456',
        'setup'
      )

      expect(verifyResult.success).toBe(true)
      expect(verifyResult.method).toEqual(verifiedMethod)

      // Step 3: Get MFA status
      mockClient.from().mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [verifiedMethod],
          error: null
        })
      })

      const statusResult = await mfaService.getMfaStatus(mockTenantId, mockUserId)

      expect(statusResult.isEnabled).toBe(true)
      expect(statusResult.methods).toHaveLength(1)
      expect(statusResult.methods[0]).toEqual(verifiedMethod)

      // Step 4: Generate new backup codes
      const newBackupCodesResult = await mfaService.generateNewBackupCodes(
        mockTenantId,
        mockUserId
      )

      expect(newBackupCodesResult.success).toBe(true)
      expect(newBackupCodesResult.backupCodes).toHaveLength(10)
    })

    it('should handle MFA verification failures', async () => {
      const mockMfaMethod = {
        id: 'mfa-123',
        tenant_id: mockTenantId,
        user_id: mockUserId,
        method_type: 'totp',
        method_name: 'Authenticator App',
        is_verified: true,
        is_primary: true,
        secret_encrypted: 'encrypted_secret'
      }

      const mockClient = createClient()
      mockClient.from().single.mockResolvedValue({
        data: mockMfaMethod,
        error: null
      })

      // Mock invalid TOTP verification
      authenticator.verify = jest.fn(() => false)

      const verifyResult = await mfaService.verifyMfaCode(
        mockTenantId,
        mockUserId,
        mockMfaMethod.id,
        '000000'
      )

      expect(verifyResult.success).toBe(false)
      expect(verifyResult.error).toBe('Invalid verification code')
    })
  })

  describe('Session Management Integration', () => {
    it('should create and validate session with device tracking', async () => {
      const mockSession = {
        id: 'session-123',
        tenant_id: mockTenantId,
        user_id: mockUserId,
        device_fingerprint: 'device-123',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 Test Browser',
        is_active: true,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        last_activity_at: new Date().toISOString()
      }

      const mockClient = createClient()

      // Step 1: Create session
      mockClient.from().single.mockResolvedValueOnce({
        data: mockSession,
        error: null
      })

      const createResult = await sessionService.createSession(
        mockTenantId,
        mockUserId,
        {
          fingerprint: 'device-123',
          name: 'Test Device',
          type: 'desktop',
          browser: { name: 'Chrome', version: '91.0' },
          os: { name: 'Windows', version: '10' }
        },
        {
          ip: '192.168.1.100',
          country: 'US',
          city: 'New York'
        },
        'Mozilla/5.0 Test Browser'
      )

      expect(createResult.success).toBe(true)
      expect(createResult.session).toEqual(mockSession)

      // Step 2: Validate session
      mockClient.from().single.mockResolvedValueOnce({
        data: mockSession,
        error: null
      })

      const validateResult = await sessionService.validateSession(
        mockSession.id
      )

      expect(validateResult.valid).toBe(true)
      expect(validateResult.session).toEqual(mockSession)

      // Step 3: Update session activity
      const updatedSession = {
        ...mockSession,
        last_activity_at: new Date().toISOString()
      }

      mockClient.from().single.mockResolvedValueOnce({
        data: updatedSession,
        error: null
      })

      const updateResult = await sessionService.updateSessionActivity(
        mockSession.id,
        '192.168.1.100'
      )

      expect(updateResult.success).toBe(true)

      // Step 4: Terminate session
      mockClient.from().single.mockResolvedValueOnce({
        data: { ...mockSession, is_active: false },
        error: null
      })

      const terminateResult = await sessionService.terminateSession(
        mockSession.id,
        'logout'
      )

      expect(terminateResult.success).toBe(true)
    })
  })

  describe('Cross-Service Integration', () => {
    it('should handle API key with MFA requirement', async () => {
      // This test simulates a scenario where an API key requires MFA verification
      const mfaRequiredApiKey = {
        id: 'key-mfa',
        tenant_id: mockTenantId,
        user_id: mockUserId,
        key_name: 'MFA Required Key',
        is_active: true,
        permissions: { admin: { user_management: true } },
        scopes: ['admin:users'],
        allowed_ips: [],
        rate_limit_requests: 100,
        rate_limit_window_seconds: 3600,
        expires_at: null,
        requires_mfa: true // Custom field for this test
      }

      const mockMfaMethod = {
        id: 'mfa-123',
        tenant_id: mockTenantId,
        user_id: mockUserId,
        method_type: 'totp',
        is_verified: true,
        is_primary: true
      }

      const mockClient = createClient()

      // Validate API key
      mockClient.from().single.mockResolvedValueOnce({
        data: mfaRequiredApiKey,
        error: null
      })

      const apiKeyResult = await apiKeyService.validateApiKey('mfa-key', 'admin:users')
      expect(apiKeyResult.valid).toBe(true)

      // Check MFA status
      mockClient.from().mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockMfaMethod],
          error: null
        })
      })

      const mfaStatus = await mfaService.getMfaStatus(mockTenantId, mockUserId)
      expect(mfaStatus.isEnabled).toBe(true)

      // Verify MFA code for high-privilege operation
      mockClient.from().single.mockResolvedValueOnce({
        data: mockMfaMethod,
        error: null
      })

      const mfaResult = await mfaService.verifyMfaCode(
        mockTenantId,
        mockUserId,
        mockMfaMethod.id,
        '123456'
      )

      expect(mfaResult.success).toBe(true)
    })
  })
})