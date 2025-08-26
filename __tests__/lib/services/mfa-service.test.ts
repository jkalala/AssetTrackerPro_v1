/* eslint-disable @typescript-eslint/no-explicit-any */
import { MfaService } from '@/lib/services/mfa-service'
import { createClient } from '@/lib/supabase/server'
import { authenticator } from 'otplib'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
    })),
  }),
}))

jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn(() => 'MOCK_SECRET'),
    keyuri: jest.fn(() => 'otpauth://totp/AssetTracker%20Pro:user@example.com?secret=MOCK_SECRET&issuer=AssetTracker%20Pro'),
    verify: jest.fn(() => true),
  },
}))

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,mock-qr-code')),
}))

// Type the mocked modules
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockAuthenticator = authenticator as jest.Mocked<typeof authenticator>

describe('MfaService', () => {
  let mfaService: MfaService

  beforeEach(() => {
    mfaService = new MfaService()
    jest.clearAllMocks()
  })

  describe('setupTOTP', () => {
    it('should setup TOTP successfully', async () => {
      const mockMethod = {
        id: 'method-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        method_type: 'totp',
        method_name: 'Authenticator App',
        is_verified: false,
        is_primary: false
      }

      const mockClient = mockCreateClient()
      mockClient.from().single.mockResolvedValue({
        data: mockMethod,
        error: null
      })

      const result = await mfaService.setupTOTP(
        'tenant-123',
        'user-123',
        'Authenticator App',
        'user@example.com'
      )

      expect(result.success).toBe(true)
      expect(result.method).toEqual(mockMethod)
      expect(result.secret).toBe('MOCK_SECRET')
      expect(result.qrCode).toBe('data:image/png;base64,mock-qr-code')
      expect(result.backupCodes).toHaveLength(10)
    })

    it('should handle setup errors', async () => {
      const mockClient = mockCreateClient()
      mockClient.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await mfaService.setupTOTP(
        'tenant-123',
        'user-123',
        'Authenticator App',
        'user@example.com'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('verifyMfaCode', () => {
    it('should verify TOTP code successfully', async () => {
      const mockMethod = {
        id: 'method-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        method_type: 'totp',
        method_name: 'Authenticator App',
        secret_encrypted: 'encrypted_secret',
        is_verified: true,
        is_primary: true
      }

      const mockClient = mockCreateClient()
      mockClient.from().single.mockResolvedValue({
        data: mockMethod,
        error: null
      })

      const result = await mfaService.verifyMfaCode(
        'tenant-123',
        'user-123',
        'method-123',
        '123456'
      )

      expect(result.success).toBe(true)
      expect(result.method).toEqual(mockMethod)
    })

    it('should reject invalid TOTP code', async () => {
      const mockMethod = {
        id: 'method-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        method_type: 'totp',
        method_name: 'Authenticator App',
        secret_encrypted: 'encrypted_secret',
        is_verified: true,
        is_primary: true
      }

      const mockClient = mockCreateClient()
      mockClient.from().single.mockResolvedValue({
        data: mockMethod,
        error: null
      })

      // Mock invalid code
      mockAuthenticator.verify.mockReturnValue(false)

      const result = await mfaService.verifyMfaCode(
        'tenant-123',
        'user-123',
        'method-123',
        '000000'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid verification code')
    })

    it('should handle missing MFA method', async () => {
      const mockClient = mockCreateClient()
      mockClient.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      })

      const result = await mfaService.verifyMfaCode(
        'tenant-123',
        'user-123',
        'nonexistent-method',
        '123456'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('MFA method not found')
    })
  })

  describe('getMfaStatus', () => {
    it('should return MFA status with methods', async () => {
      const mockMethods = [
        {
          id: 'method-1',
          tenant_id: 'tenant-123',
          user_id: 'user-123',
          method_type: 'totp',
          method_name: 'Authenticator App',
          is_verified: true,
          is_primary: true,
          backup_codes: null
        },
        {
          id: 'method-2',
          tenant_id: 'tenant-123',
          user_id: 'user-123',
          method_type: 'backup_codes',
          method_name: 'Backup Codes',
          is_verified: true,
          is_primary: false,
          backup_codes: ['code1', 'code2', 'code3']
        }
      ]

      const mockClient = mockCreateClient()
      mockClient.from().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockMethods,
          error: null
        })
      })

      const result = await mfaService.getMfaStatus('tenant-123', 'user-123')

      expect(result.isEnabled).toBe(true)
      expect(result.methods).toHaveLength(2)
      expect(result.primaryMethod).toEqual(mockMethods[0])
      expect(result.backupCodesRemaining).toBe(3)
    })

    it('should return disabled status when no methods exist', async () => {
      const mockClient = mockCreateClient()
      mockClient.from().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      const result = await mfaService.getMfaStatus('tenant-123', 'user-123')

      expect(result.isEnabled).toBe(false)
      expect(result.methods).toHaveLength(0)
      expect(result.primaryMethod).toBeUndefined()
      expect(result.backupCodesRemaining).toBe(0)
    })
  })

  describe('generateNewBackupCodes', () => {
    it('should generate new backup codes', async () => {
      const mockClient = mockCreateClient()
      mockClient.from().single.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await mfaService.generateNewBackupCodes('tenant-123', 'user-123')

      expect(result.success).toBe(true)
      expect(result.backupCodes).toHaveLength(10)
      expect(result.backupCodes![0]).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/)
    })
  })

  describe('verifyBackupCode', () => {
    it('should verify backup code successfully', async () => {
      const mockMethod = {
        id: 'method-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        method_type: 'backup_codes',
        backup_codes: ['ABCD-1234', 'EFGH-5678'],
        is_verified: true
      }

      const mockClient = mockCreateClient()
      mockClient.from().single.mockResolvedValue({
        data: mockMethod,
        error: null
      })

      const result = await mfaService.verifyBackupCode(
        'tenant-123',
        'user-123',
        'ABCD-1234'
      )

      expect(result.success).toBe(true)
      expect(result.codesRemaining).toBe(1)
    })

    it('should reject invalid backup code', async () => {
      const mockMethod = {
        id: 'method-123',
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        method_type: 'backup_codes',
        backup_codes: ['ABCD-1234', 'EFGH-5678'],
        is_verified: true
      }

      const mockClient = mockCreateClient()
      mockClient.from().single.mockResolvedValue({
        data: mockMethod,
        error: null
      })

      const result = await mfaService.verifyBackupCode(
        'tenant-123',
        'user-123',
        'INVALID-CODE'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid backup code')
    })
  })

  describe('disableMfa', () => {
    it('should disable MFA successfully', async () => {
      const mockClient = mockCreateClient()
      mockClient.from().mockResolvedValue({
        data: null,
        error: null
      })

      const result = await mfaService.disableMfa('tenant-123', 'user-123')

      expect(result.success).toBe(true)
    })

    it('should handle disable MFA errors', async () => {
      const mockClient = mockCreateClient()
      mockClient.from().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await mfaService.disableMfa('tenant-123', 'user-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('generateTOTPSecret', () => {
    it('should generate TOTP secret with correct format', () => {
      const secret = mfaService.generateTOTPSecret()
      
      expect(secret).toBe('MOCK_SECRET')
      expect(typeof secret).toBe('string')
      expect(secret.length).toBeGreaterThan(0)
    })
  })

  describe('generateQRCode', () => {
    it('should generate QR code data URL', async () => {
      const qrCode = await mfaService.generateQRCodeForSetup('MOCK_SECRET', 'user@example.com')
      
      expect(qrCode).toBe('data:image/png;base64,mock-qr-code')
      expect(qrCode.startsWith('data:image/png;base64,')).toBe(true)
    })
  })

  describe('validateTOTPToken', () => {
    it('should validate TOTP token correctly', () => {
      mockAuthenticator.verify.mockReturnValue(true)

      const isValid = mfaService.validateTOTPToken('MOCK_SECRET', '123456')
      
      expect(isValid).toBe(true)
      expect(mockAuthenticator.verify).toHaveBeenCalledWith({
        token: '123456',
        secret: 'MOCK_SECRET'
      })
    })

    it('should reject invalid TOTP token', () => {
      mockAuthenticator.verify.mockReturnValue(false)

      const isValid = mfaService.validateTOTPToken('MOCK_SECRET', '000000')
      
      expect(isValid).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockClient = mockCreateClient()
      mockClient.from().single.mockRejectedValue(new Error('Network error'))

      const result = await mfaService.setupTOTP(
        'tenant-123',
        'user-123',
        'Authenticator App',
        'user@example.com'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should handle missing user context', async () => {
      const result = await mfaService.getMfaStatus('', '')

      expect(result.isEnabled).toBe(false)
      expect(result.methods).toHaveLength(0)
    })
  })
})