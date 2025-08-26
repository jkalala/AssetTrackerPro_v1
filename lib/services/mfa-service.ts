// =====================================================
// MULTI-FACTOR AUTHENTICATION SERVICE
// =====================================================
// Service for managing MFA methods, verification, and security

import { createClient } from '@/lib/supabase/server'
import { 
  MfaMethod, 
  MfaMethodInsert, 
  MfaMethodUpdate,
  MfaVerificationAttempt,
  SecurityEventInsert
} from '@/lib/types/database'
import { authenticator } from 'otplib'
import crypto from 'crypto'

export interface MfaSetupResult {
  success: boolean
  method?: MfaMethod
  secret?: string
  qrCode?: string
  backupCodes?: string[]
  error?: string
}

export interface MfaVerificationResult {
  success: boolean
  method?: MfaMethod
  requiresBackup?: boolean
  error?: string
}

export interface MfaStatusResult {
  isEnabled: boolean
  methods: MfaMethod[]
  primaryMethod?: MfaMethod
  backupCodesRemaining: number
}

export class MfaService {
  private async getSupabase() {
    return createClient()
  }

  // =====================================================
  // MFA SETUP AND MANAGEMENT
  // =====================================================

  /**
   * Set up TOTP (Time-based One-Time Password) authentication
   */
  async setupTOTP(
    tenantId: string,
    userId: string,
    methodName: string,
    userEmail: string
  ): Promise<MfaSetupResult> {
    try {
      const supabase = await this.getSupabase()

      // Generate TOTP secret
      const secret = authenticator.generateSecret()
      const serviceName = 'AssetTracker Pro'
      const otpAuthUrl = authenticator.keyuri(userEmail, serviceName, secret)

      // Encrypt the secret
      const encryptedSecret = this.encryptSecret(secret)

      // Generate backup codes
      const backupCodes = this.generateBackupCodes()
      const encryptedBackupCodes = backupCodes.map(code => this.encryptSecret(code))

      // Create MFA method record
      const methodData: MfaMethodInsert = {
        tenant_id: tenantId,
        user_id: userId,
        method_type: 'totp',
        method_name: methodName,
        secret_encrypted: encryptedSecret,
        backup_codes: encryptedBackupCodes,
        is_verified: false,
        is_primary: false
      }

      const { data: method, error } = await supabase
        .from('mfa_methods')
        .insert(methodData)
        .select()
        .single()

      if (error) {
        console.error('Error creating TOTP method:', error)
        return { success: false, error: error.message }
      }

      // Generate QR code data URL
      const qrCode = await this.generateQRCode(otpAuthUrl)

      return {
        success: true,
        method,
        secret,
        qrCode,
        backupCodes
      }
    } catch (error) {
      console.error('Error setting up TOTP:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Set up SMS-based MFA
   */
  async setupSMS(
    tenantId: string,
    userId: string,
    methodName: string,
    phoneNumber: string
  ): Promise<MfaSetupResult> {
    try {
      const supabase = await this.getSupabase()

      // Encrypt phone number
      const encryptedPhone = this.encryptSecret(phoneNumber)

      // Create MFA method record
      const methodData: MfaMethodInsert = {
        tenant_id: tenantId,
        user_id: userId,
        method_type: 'sms',
        method_name: methodName,
        secret_encrypted: encryptedPhone,
        is_verified: false,
        is_primary: false
      }

      const { data: method, error } = await supabase
        .from('mfa_methods')
        .insert(methodData)
        .select()
        .single()

      if (error) {
        console.error('Error creating SMS method:', error)
        return { success: false, error: error.message }
      }

      // Send verification SMS
      const verificationCode = this.generateVerificationCode()
      await this.sendSMSVerification(phoneNumber, verificationCode)

      // Store verification attempt
      await this.createVerificationAttempt(
        tenantId,
        userId,
        method.id,
        'setup',
        verificationCode
      )

      return {
        success: true,
        method
      }
    } catch (error) {
      console.error('Error setting up SMS:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Set up email-based MFA
   */
  async setupEmail(
    tenantId: string,
    userId: string,
    methodName: string,
    email: string
  ): Promise<MfaSetupResult> {
    try {
      const supabase = await this.getSupabase()

      // Encrypt email
      const encryptedEmail = this.encryptSecret(email)

      // Create MFA method record
      const methodData: MfaMethodInsert = {
        tenant_id: tenantId,
        user_id: userId,
        method_type: 'email',
        method_name: methodName,
        secret_encrypted: encryptedEmail,
        is_verified: false,
        is_primary: false
      }

      const { data: method, error } = await supabase
        .from('mfa_methods')
        .insert(methodData)
        .select()
        .single()

      if (error) {
        console.error('Error creating email method:', error)
        return { success: false, error: error.message }
      }

      // Send verification email
      const verificationCode = this.generateVerificationCode()
      await this.sendEmailVerification(email, verificationCode)

      // Store verification attempt
      await this.createVerificationAttempt(
        tenantId,
        userId,
        method.id,
        'setup',
        verificationCode
      )

      return {
        success: true,
        method
      }
    } catch (error) {
      console.error('Error setting up email MFA:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // MFA VERIFICATION
  // =====================================================

  /**
   * Verify MFA code during login or setup
   */
  async verifyMfaCode(
    tenantId: string,
    userId: string,
    methodId: string,
    code: string,
    attemptType: 'login' | 'setup' | 'recovery' = 'login'
  ): Promise<MfaVerificationResult> {
    try {
      const supabase = await this.getSupabase()

      // Get MFA method
      const { data: method, error: methodError } = await supabase
        .from('mfa_methods')
        .select('*')
        .eq('id', methodId)
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .single()

      if (methodError || !method) {
        return { success: false, error: 'MFA method not found' }
      }

      let isValid = false
      let usedBackupCode = false

      // Verify based on method type
      switch (method.method_type) {
        case 'totp':
          isValid = await this.verifyTOTPCode(method, code)
          break
        case 'sms':
        case 'email':
          isValid = await this.verifyTemporaryCode(method, code)
          break
        case 'backup_codes':
          const backupResult = await this.verifyBackupCodeInternal(method, code)
          isValid = backupResult.valid
          usedBackupCode = backupResult.used
          break
      }

      // Create verification attempt record
      await this.createVerificationAttempt(
        tenantId,
        userId,
        methodId,
        attemptType,
        code,
        isValid
      )

      if (!isValid) {
        // Log security event for failed verification
        await this.logSecurityEvent(tenantId, userId, 'mfa_failure', {
          method_type: method.method_type,
          method_name: method.method_name,
          attempt_type: attemptType
        })

        return { success: false, error: 'Invalid verification code' }
      }

      // Update method as verified if this is setup
      if (attemptType === 'setup' && !method.is_verified) {
        await supabase
          .from('mfa_methods')
          .update({ 
            is_verified: true,
            last_used_at: new Date().toISOString()
          })
          .eq('id', methodId)
      } else {
        // Update last used timestamp
        await supabase
          .from('mfa_methods')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', methodId)
      }

      // If backup code was used, update the method
      if (usedBackupCode) {
        await this.updateMethodAfterBackupCodeUse(method, code)
      }

      // Log successful verification
      await this.logSecurityEvent(tenantId, userId, 'mfa_success', {
        method_type: method.method_type,
        method_name: method.method_name,
        attempt_type: attemptType,
        used_backup_code: usedBackupCode
      })

      return {
        success: true,
        method,
        requiresBackup: method.method_type !== 'backup_codes' && 
                       method.backup_codes && 
                       method.backup_codes.length <= 2
      }
    } catch (error) {
      console.error('Error verifying MFA code:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get MFA status for user
   */
  async getMfaStatus(tenantId: string, userId: string): Promise<MfaStatusResult> {
    try {
      const supabase = await this.getSupabase()

      const { data: methods, error } = await supabase
        .from('mfa_methods')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('is_verified', true)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting MFA status:', error)
        return {
          isEnabled: false,
          methods: [],
          backupCodesRemaining: 0
        }
      }

      const primaryMethod = methods.find(m => m.is_primary)
      const backupMethod = methods.find(m => m.method_type === 'backup_codes')
      const backupCodesRemaining = backupMethod?.backup_codes?.length || 0

      return {
        isEnabled: methods.length > 0,
        methods,
        primaryMethod,
        backupCodesRemaining
      }
    } catch (error) {
      console.error('Error getting MFA status:', error)
      return {
        isEnabled: false,
        methods: [],
        backupCodesRemaining: 0
      }
    }
  }

  /**
   * Disable MFA method
   */
  async disableMfaMethod(
    tenantId: string,
    userId: string,
    methodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      const { error } = await supabase
        .from('mfa_methods')
        .delete()
        .eq('id', methodId)
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error disabling MFA method:', error)
        return { success: false, error: error.message }
      }

      // Log security event
      await this.logSecurityEvent(tenantId, userId, 'mfa_success', {
        action: 'method_disabled',
        method_id: methodId
      })

      return { success: true }
    } catch (error) {
      console.error('Error disabling MFA method:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify MFA setup during initial configuration
   */
  async verifyMfaSetup(
    tenantId: string,
    userId: string,
    code: string,
    methodId?: string
  ): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      // Find the unverified TOTP method for this user
      let method
      if (methodId) {
        const { data, error } = await supabase
          .from('mfa_methods')
          .select('*')
          .eq('id', methodId)
          .eq('tenant_id', tenantId)
          .eq('user_id', userId)
          .single()
        
        if (error || !data) {
          return { success: false, error: 'MFA method not found' }
        }
        method = data
      } else {
        // Find the most recent unverified TOTP method
        const { data, error } = await supabase
          .from('mfa_methods')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('user_id', userId)
          .eq('method_type', 'totp')
          .eq('is_verified', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (error || !data) {
          return { success: false, error: 'No pending MFA setup found' }
        }
        method = data
      }

      // Verify the TOTP code
      const isValid = await this.verifyTOTPCode(method, code)
      
      if (!isValid) {
        return { success: false, error: 'Invalid verification code' }
      }

      // Mark method as verified and primary if it's the first one
      const { data: existingMethods } = await supabase
        .from('mfa_methods')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('is_verified', true)

      const isPrimary = !existingMethods || existingMethods.length === 0

      await supabase
        .from('mfa_methods')
        .update({ 
          is_verified: true,
          is_primary: isPrimary,
          verified_at: new Date().toISOString()
        })
        .eq('id', method.id)

      // Decrypt and return backup codes
      const backupCodes = method.backup_codes?.map((encryptedCode: string) => 
        this.decryptSecret(encryptedCode)
      ) || []

      return {
        success: true,
        backupCodes
      }
    } catch (error) {
      console.error('Error verifying MFA setup:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // BACKUP CODES
  // =====================================================

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(
    tenantId: string,
    userId: string
  ): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes()
      const encryptedBackupCodes = backupCodes.map(code => this.encryptSecret(code))

      // Check if backup codes method exists
      const { data: existingMethod } = await supabase
        .from('mfa_methods')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('method_type', 'backup_codes')
        .single()

      if (existingMethod) {
        // Update existing method
        const { error } = await supabase
          .from('mfa_methods')
          .update({ backup_codes: encryptedBackupCodes })
          .eq('id', existingMethod.id)

        if (error) {
          return { success: false, error: error.message }
        }
      } else {
        // Create new backup codes method
        const methodData: MfaMethodInsert = {
          tenant_id: tenantId,
          user_id: userId,
          method_type: 'backup_codes',
          method_name: 'Backup Codes',
          backup_codes: encryptedBackupCodes,
          is_verified: true,
          is_primary: false
        }

        const { error } = await supabase
          .from('mfa_methods')
          .insert(methodData)

        if (error) {
          return { success: false, error: error.message }
        }
      }

      return {
        success: true,
        backupCodes
      }
    } catch (error) {
      console.error('Error generating backup codes:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private async verifyTOTPCode(method: MfaMethod, code: string): Promise<boolean> {
    try {
      if (!method.secret_encrypted) return false
      
      const secret = this.decryptSecret(method.secret_encrypted)
      return authenticator.verify({ token: code, secret })
    } catch (error) {
      console.error('Error verifying TOTP code:', error)
      return false
    }
  }

  private async verifyTemporaryCode(method: MfaMethod, code: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()

      // Check for valid verification attempt
      const { data: attempt } = await supabase
        .from('mfa_verification_attempts')
        .select('*')
        .eq('mfa_method_id', method.id)
        .eq('is_successful', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!attempt || !attempt.code_hash) return false

      const codeHash = crypto.createHash('sha256').update(code).digest('hex')
      return codeHash === attempt.code_hash
    } catch (error) {
      console.error('Error verifying temporary code:', error)
      return false
    }
  }

  private async verifyBackupCodeInternal(
    method: MfaMethod, 
    code: string
  ): Promise<{ valid: boolean; used: boolean }> {
    try {
      if (!method.backup_codes) return { valid: false, used: false }

      const codeHash = crypto.createHash('sha256').update(code).digest('hex')
      
      for (const encryptedCode of method.backup_codes) {
        const decryptedCode = this.decryptSecret(encryptedCode)
        const storedHash = crypto.createHash('sha256').update(decryptedCode).digest('hex')
        
        if (codeHash === storedHash) {
          return { valid: true, used: true }
        }
      }

      return { valid: false, used: false }
    } catch (error) {
      console.error('Error verifying backup code:', error)
      return { valid: false, used: false }
    }
  }

  private async updateMethodAfterBackupCodeUse(method: MfaMethod, usedCode: string): Promise<void> {
    try {
      if (!method.backup_codes) return

      const supabase = await this.getSupabase()
      const codeHash = crypto.createHash('sha256').update(usedCode).digest('hex')
      
      // Remove used backup code
      const updatedCodes = method.backup_codes.filter(encryptedCode => {
        const decryptedCode = this.decryptSecret(encryptedCode)
        const storedHash = crypto.createHash('sha256').update(decryptedCode).digest('hex')
        return codeHash !== storedHash
      })

      await supabase
        .from('mfa_methods')
        .update({ backup_codes: updatedCodes })
        .eq('id', method.id)
    } catch (error) {
      console.error('Error updating backup codes:', error)
    }
  }

  private async createVerificationAttempt(
    tenantId: string,
    userId: string,
    methodId: string,
    attemptType: 'login' | 'setup' | 'recovery',
    code?: string,
    isSuccessful: boolean = false
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase()

      const codeHash = code ? crypto.createHash('sha256').update(code).digest('hex') : undefined

      await supabase
        .from('mfa_verification_attempts')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          mfa_method_id: methodId,
          attempt_type: attemptType,
          code_hash: codeHash,
          is_successful: isSuccessful,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        })
    } catch (error) {
      console.error('Error creating verification attempt:', error)
    }
  }

  private async logSecurityEvent(
    tenantId: string,
    userId: string,
    eventType: 'mfa_success' | 'mfa_failure',
    details: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase()

      const eventData: SecurityEventInsert = {
        tenant_id: tenantId,
        user_id: userId,
        event_type: eventType,
        severity: eventType === 'mfa_failure' ? 'medium' : 'low',
        description: eventType === 'mfa_failure' 
          ? 'MFA verification failed' 
          : 'MFA verification successful',
        details
      }

      await supabase
        .from('security_events')
        .insert(eventData)
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }

  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase()
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
    }
    return codes
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  private encryptSecret(secret: string): string {
    // In production, use proper encryption with a key management service
    // This is a simplified example
    const algorithm = 'aes-256-gcm'
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32)
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(secret, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return `${iv.toString('hex')}:${encrypted}`
  }

  private decryptSecret(encryptedSecret: string): string {
    // In production, use proper decryption with a key management service
    const algorithm = 'aes-256-gcm'
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32)
    
    const [ivHex, encrypted] = encryptedSecret.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  private async generateQRCode(data: string): Promise<string> {
    try {
      const QRCode = await import('qrcode')
      return await QRCode.toDataURL(data)
    } catch (error) {
      console.error('Error generating QR code:', error)
      return ''
    }
  }

  private async sendSMSVerification(phoneNumber: string, code: string): Promise<void> {
    // Implement SMS sending logic here
    // This would integrate with services like Twilio, AWS SNS, etc.
    console.log(`SMS verification code ${code} would be sent to ${phoneNumber}`)
  }

  private async sendEmailVerification(email: string, code: string): Promise<void> {
    // Implement email sending logic here
    // This would integrate with your email service
    console.log(`Email verification code ${code} would be sent to ${email}`)
  }

  // =====================================================
  // PUBLIC METHODS FOR TESTING
  // =====================================================



  /**
   * Verify backup code (public for testing)
   */
  async verifyBackupCode(tenantId: string, userId: string, code: string): Promise<{ success: boolean; codesRemaining?: number; error?: string }> {
    try {
      const supabase = await this.getSupabase()
      
      // Get user's backup codes
      const { data: method } = await supabase
        .from('mfa_methods')
        .select('backup_codes')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('method_type', 'backup_codes')
        .eq('is_active', true)
        .single()

      if (!method || !method.backup_codes) {
        return { success: false, error: 'No backup codes found' }
      }

      const backupCodes = method.backup_codes as string[]
      const codeIndex = backupCodes.findIndex(c => c === code)
      
      if (codeIndex === -1) {
        return { success: false, error: 'Invalid backup code' }
      }

      // Mark code as used by removing it
      const updatedCodes = backupCodes.filter((_, index) => index !== codeIndex)
      
      await supabase
        .from('mfa_methods')
        .update({ backup_codes: updatedCodes })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('method_type', 'backup_codes')

      return { success: true, codesRemaining: updatedCodes.length }
    } catch (error) {
      console.error('Error verifying backup code:', error)
      return { success: false, error: 'Failed to verify backup code' }
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMfa(tenantId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase()
      
      const { error } = await supabase
        .from('mfa_methods')
        .update({ is_active: false })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Generate TOTP secret
   */
  generateTOTPSecret(): string {
    return authenticator.generateSecret()
  }

  /**
   * Generate QR code for TOTP setup (public for testing)
   */
  async generateQRCodeForSetup(secret: string, userEmail?: string): Promise<string> {
    const serviceName = 'AssetTracker Pro'
    const accountName = userEmail || 'user'
    
    const otpauth = authenticator.keyuri(accountName, serviceName, secret)
    return await this.generateQRCode(otpauth)
  }



  /**
   * Validate TOTP token
   */
  validateTOTPToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret })
    } catch (error) {
      console.error('Error validating TOTP token:', error)
      return false
    }
  }
}

// Export singleton instance
export const mfaService = new MfaService()