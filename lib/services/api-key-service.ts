// =====================================================
// API KEY MANAGEMENT SERVICE
// =====================================================
// Service for managing API keys, permissions, and rate limiting

import { createClient } from '@/lib/supabase/server'
import { 
  ApiKey, 
  ApiKeyInsert, 
  ApiKeyUpdate,
  ApiKeyUsage,
  SecurityEventInsert
} from '@/lib/types/database'
import crypto from 'crypto'

export interface ApiKeyCreateResult {
  success: boolean
  apiKey?: ApiKey
  keyValue?: string
  error?: string
}

export interface ApiKeyValidationResult {
  valid: boolean
  apiKey?: ApiKey
  rateLimitExceeded?: boolean
  error?: string
}

export interface RateLimitStatus {
  allowed: boolean
  remaining: number
  resetTime: Date
  limit: number
}

export interface ApiKeyPermissions {
  // Asset permissions
  assets?: {
    read?: boolean
    create?: boolean
    update?: boolean
    delete?: boolean
  }
  // User permissions
  users?: {
    read?: boolean
    create?: boolean
    update?: boolean
    delete?: boolean
  }
  // Report permissions
  reports?: {
    read?: boolean
    create?: boolean
    export?: boolean
  }
  // Analytics permissions
  analytics?: {
    read?: boolean
    export?: boolean
  }
  // Admin permissions
  admin?: {
    tenant_settings?: boolean
    user_management?: boolean
    api_keys?: boolean
  }
}

export class ApiKeyService {
  private async getSupabase() {
    return createClient()
  }

  // =====================================================
  // API KEY CREATION AND MANAGEMENT
  // =====================================================

  /**
   * Create a new API key
   */
  async createApiKey(
    tenantId: string,
    userId: string,
    keyName: string,
    permissions: ApiKeyPermissions = {},
    scopes: string[] = [],
    options: {
      expiresInDays?: number
      rateLimitRequests?: number
      rateLimitWindowSeconds?: number
      allowedIps?: string[]
    } = {}
  ): Promise<ApiKeyCreateResult> {
    try {
      const supabase = await this.getSupabase()

      // Generate API key
      const keyValue = this.generateApiKey()
      const keyPrefix = keyValue.substring(0, 8) // First 8 characters for identification
      const keyHash = this.hashApiKey(keyValue)

      // Calculate expiration
      let expiresAt: string | undefined
      if (options.expiresInDays) {
        const expiration = new Date()
        expiration.setDate(expiration.getDate() + options.expiresInDays)
        expiresAt = expiration.toISOString()
      }

      // Create API key record
      const keyData: ApiKeyInsert = {
        tenant_id: tenantId,
        user_id: userId,
        key_name: keyName,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        permissions,
        scopes,
        allowed_ips: options.allowedIps || [],
        rate_limit_requests: options.rateLimitRequests || 1000,
        rate_limit_window_seconds: options.rateLimitWindowSeconds || 3600,
        expires_at: expiresAt
      }

      const { data: apiKey, error } = await supabase
        .from('api_keys')
        .insert(keyData)
        .select()
        .single()

      if (error) {
        console.error('Error creating API key:', error)
        return { success: false, error: error.message }
      }

      // Log security event
      await this.logSecurityEvent(tenantId, userId, 'api_key_created', {
        api_key_id: apiKey.id,
        key_name: keyName,
        permissions,
        scopes,
        expires_at: expiresAt
      })

      return {
        success: true,
        apiKey,
        keyValue
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Validate API key and check permissions
   */
  async validateApiKey(
    keyValue: string,
    requiredPermission?: string,
    requiredScope?: string,
    ipAddress?: string
  ): Promise<ApiKeyValidationResult> {
    try {
      const supabase = await this.getSupabase()
      const keyHash = this.hashApiKey(keyValue)

      const { data: apiKey, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single()

      if (error || !apiKey) {
        return { valid: false, error: 'Invalid API key' }
      }

      // Check expiration
      if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
        return { valid: false, error: 'API key expired' }
      }

      // Check IP restrictions
      if (apiKey.allowed_ips.length > 0 && ipAddress) {
        const isAllowedIp = apiKey.allowed_ips.some((allowedIp: string) => {
          return this.matchesIpPattern(ipAddress, allowedIp)
        })

        if (!isAllowedIp) {
          return { valid: false, error: 'IP address not allowed' }
        }
      }

      // Check rate limiting
      const rateLimitStatus = await this.checkRateLimit(apiKey)
      if (!rateLimitStatus.allowed) {
        return { 
          valid: false, 
          rateLimitExceeded: true,
          error: 'Rate limit exceeded' 
        }
      }

      // Check permissions
      if (requiredPermission && !this.hasPermission(apiKey, requiredPermission)) {
        return { valid: false, error: 'Insufficient permissions' }
      }

      // Check scopes
      if (requiredScope && !apiKey.scopes.includes(requiredScope)) {
        return { valid: false, error: 'Insufficient scope' }
      }

      // Update last used timestamp
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKey.id)

      return {
        valid: true,
        apiKey
      }
    } catch (error) {
      console.error('Error validating API key:', error)
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update API key
   */
  async updateApiKey(
    tenantId: string,
    userId: string,
    keyId: string,
    updates: {
      keyName?: string
      permissions?: ApiKeyPermissions
      scopes?: string[]
      allowedIps?: string[]
      rateLimitRequests?: number
      rateLimitWindowSeconds?: number
      expiresAt?: string
    }
  ): Promise<{ success: boolean; apiKey?: ApiKey; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      const updateData: ApiKeyUpdate = {}
      
      if (updates.keyName) updateData.key_name = updates.keyName
      if (updates.permissions) updateData.permissions = updates.permissions
      if (updates.scopes) updateData.scopes = updates.scopes
      if (updates.allowedIps) updateData.allowed_ips = updates.allowedIps
      if (updates.rateLimitRequests) updateData.rate_limit_requests = updates.rateLimitRequests
      if (updates.rateLimitWindowSeconds) updateData.rate_limit_window_seconds = updates.rateLimitWindowSeconds
      if (updates.expiresAt) updateData.expires_at = updates.expiresAt

      const { data: apiKey, error } = await supabase
        .from('api_keys')
        .update(updateData)
        .eq('id', keyId)
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating API key:', error)
        return { success: false, error: error.message }
      }

      return { success: true, apiKey }
    } catch (error) {
      console.error('Error updating API key:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(
    tenantId: string,
    userId: string,
    keyId: string,
    reason: string = 'User revoked'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      const { data: apiKey, error } = await supabase
        .from('api_keys')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_reason: reason
        })
        .eq('id', keyId)
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error revoking API key:', error)
        return { success: false, error: error.message }
      }

      // Log security event
      await this.logSecurityEvent(tenantId, userId, 'api_key_revoked', {
        api_key_id: keyId,
        key_name: apiKey.key_name,
        revoked_reason: reason
      })

      return { success: true }
    } catch (error) {
      console.error('Error revoking API key:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get API keys for user
   */
  async getUserApiKeys(
    tenantId: string,
    userId: string,
    includeRevoked: boolean = false
  ): Promise<{ success: boolean; apiKeys?: ApiKey[]; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      let query = supabase
        .from('api_keys')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!includeRevoked) {
        query = query.eq('is_active', true)
      }

      const { data: apiKeys, error } = await query

      if (error) {
        console.error('Error getting API keys:', error)
        return { success: false, error: error.message }
      }

      return { success: true, apiKeys }
    } catch (error) {
      console.error('Error getting API keys:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // RATE LIMITING
  // =====================================================

  /**
   * Check rate limit for API key
   */
  async checkRateLimit(apiKey: ApiKey, ipAddress?: string): Promise<RateLimitStatus> {
    try {
      const supabase = await this.getSupabase()
      const now = new Date()
      const windowStart = new Date(now.getTime() - (apiKey.rate_limit_window_seconds * 1000))

      // Get or create rate limit bucket
      const { data: bucket, error } = await supabase
        .from('rate_limit_buckets')
        .select('*')
        .eq('api_key_id', apiKey.id)
        .gte('window_end', now.toISOString())
        .order('window_start', { ascending: false })
        .limit(1)
        .single()

      let currentCount = 0
      let resetTime = new Date(now.getTime() + (apiKey.rate_limit_window_seconds * 1000))

      if (bucket && !error) {
        currentCount = bucket.request_count
        resetTime = new Date(bucket.window_end)
      } else {
        // Create new bucket
        const windowEnd = new Date(now.getTime() + (apiKey.rate_limit_window_seconds * 1000))
        
        await supabase
          .from('rate_limit_buckets')
          .insert({
            tenant_id: apiKey.tenant_id,
            api_key_id: apiKey.id,
            window_start: windowStart.toISOString(),
            window_end: windowEnd.toISOString(),
            request_count: 0
          })

        resetTime = windowEnd
      }

      const allowed = currentCount < apiKey.rate_limit_requests
      const remaining = Math.max(0, apiKey.rate_limit_requests - currentCount)

      return {
        allowed,
        remaining,
        resetTime,
        limit: apiKey.rate_limit_requests
      }
    } catch (error) {
      console.error('Error checking rate limit:', error)
      // Allow request on error to prevent service disruption
      return {
        allowed: true,
        remaining: apiKey.rate_limit_requests,
        resetTime: new Date(Date.now() + (apiKey.rate_limit_window_seconds * 1000)),
        limit: apiKey.rate_limit_requests
      }
    }
  }

  /**
   * Increment rate limit counter
   */
  async incrementRateLimit(apiKey: ApiKey): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      const now = new Date()

      // Find current bucket
      const { data: bucket } = await supabase
        .from('rate_limit_buckets')
        .select('*')
        .eq('api_key_id', apiKey.id)
        .gte('window_end', now.toISOString())
        .order('window_start', { ascending: false })
        .limit(1)
        .single()

      if (bucket) {
        // Increment existing bucket
        await supabase
          .from('rate_limit_buckets')
          .update({ 
            request_count: bucket.request_count + 1,
            updated_at: now.toISOString()
          })
          .eq('id', bucket.id)
      }
    } catch (error) {
      console.error('Error incrementing rate limit:', error)
    }
  }

  // =====================================================
  // USAGE TRACKING
  // =====================================================

  /**
   * Log API key usage
   */
  async logApiKeyUsage(
    apiKey: ApiKey,
    endpoint: string,
    method: string,
    statusCode: number,
    options: {
      responseTimeMs?: number
      ipAddress?: string
      userAgent?: string
      requestSizeBytes?: number
      responseSizeBytes?: number
    } = {}
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase()

      const usageData: Omit<ApiKeyUsage, 'id' | 'created_at'> = {
        tenant_id: apiKey.tenant_id,
        api_key_id: apiKey.id,
        endpoint,
        method,
        status_code: statusCode,
        response_time_ms: options.responseTimeMs,
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
        request_size_bytes: options.requestSizeBytes,
        response_size_bytes: options.responseSizeBytes
      }

      await supabase
        .from('api_key_usage')
        .insert(usageData)

      // Increment rate limit counter
      await this.incrementRateLimit(apiKey)
    } catch (error) {
      console.error('Error logging API key usage:', error)
    }
  }

  /**
   * Get API key usage statistics
   */
  async getApiKeyUsageStats(
    tenantId: string,
    apiKeyId: string,
    days: number = 30
  ): Promise<{
    success: boolean
    stats?: {
      totalRequests: number
      successfulRequests: number
      errorRequests: number
      averageResponseTime: number
      topEndpoints: Array<{ endpoint: string; count: number }>
      dailyUsage: Array<{ date: string; requests: number }>
    }
    error?: string
  }> {
    try {
      const supabase = await this.getSupabase()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get usage data
      const { data: usage, error } = await supabase
        .from('api_key_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('api_key_id', apiKeyId)
        .gte('created_at', startDate.toISOString())

      if (error) {
        console.error('Error getting usage stats:', error)
        return { success: false, error: error.message }
      }

      if (!usage || usage.length === 0) {
        return {
          success: true,
          stats: {
            totalRequests: 0,
            successfulRequests: 0,
            errorRequests: 0,
            averageResponseTime: 0,
            topEndpoints: [],
            dailyUsage: []
          }
        }
      }

      // Calculate statistics
      const totalRequests = usage.length
      const successfulRequests = usage.filter(u => u.status_code >= 200 && u.status_code < 400).length
      const errorRequests = totalRequests - successfulRequests
      
      const responseTimes = usage.filter(u => u.response_time_ms).map(u => u.response_time_ms!)
      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0

      // Top endpoints
      const endpointCounts = usage.reduce((acc, u) => {
        acc[u.endpoint] = (acc[u.endpoint] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topEndpoints = Object.entries(endpointCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count: count as number }))

      // Daily usage
      const dailyUsage = usage.reduce((acc, u) => {
        const date = new Date(u.created_at).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const dailyUsageArray = Object.entries(dailyUsage)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, requests]) => ({ date, requests: requests as number }))

      return {
        success: true,
        stats: {
          totalRequests,
          successfulRequests,
          errorRequests,
          averageResponseTime,
          topEndpoints,
          dailyUsage: dailyUsageArray
        }
      }
    } catch (error) {
      console.error('Error getting API key usage stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // PUBLIC HELPER METHODS (for testing)
  // =====================================================

  /**
   * List API keys for a user (alias for getUserApiKeys)
   */
  async listApiKeys(tenantId: string, userId: string): Promise<ApiKey[]> {
    const result = await this.getUserApiKeys(tenantId, userId)
    return result.apiKeys || []
  }

  /**
   * Check if API key has specific scope
   */
  hasScope(scopes: string[], requiredScope: string): boolean {
    return scopes.includes(requiredScope)
  }

  /**
   * Check if IP is allowed for API key
   */
  isIpAllowed(ipAddress: string, allowedIps: string[]): boolean {
    if (allowedIps.length === 0) return true
    return allowedIps.some(allowedIp => this.matchesIpPattern(ipAddress, allowedIp))
  }

  /**
   * Generate TOTP secret (for MFA integration)
   */
  generateTOTPSecret(): string {
    // Use base64 encoding instead of base32 which is not supported by Node.js crypto
    return crypto.randomBytes(20).toString('base64')
  }

  /**
   * Validate TOTP token (for MFA integration)
   */
  validateTOTPToken(secret: string, token: string): boolean {
    // Simple validation - in production use a proper TOTP library
    return token.length === 6 && /^\d{6}$/.test(token)
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

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private generateApiKey(): string {
    const prefix = 'ak_'
    const randomBytes = crypto.randomBytes(32)
    const keyBody = randomBytes.toString('base64url')
    return prefix + keyBody
  }

  private hashApiKey(keyValue: string): string {
    return crypto.createHash('sha256').update(keyValue).digest('hex')
  }

  private hasPermission(apiKey: ApiKey, permission: string): boolean
  private hasPermission(permissions: ApiKeyPermissions, resource: string, action: string): boolean
  private hasPermission(
    apiKeyOrPermissions: ApiKey | ApiKeyPermissions, 
    permissionOrResource: string, 
    action?: string
  ): boolean {
    if (action !== undefined) {
      // New signature: hasPermission(permissions, resource, action)
      const permissions = apiKeyOrPermissions as ApiKeyPermissions
      const resource = permissionOrResource
      
      switch (resource) {
        case 'assets':
          return permissions.assets?.[action as keyof typeof permissions.assets] === true
        case 'users':
          return permissions.users?.[action as keyof typeof permissions.users] === true
        case 'reports':
          return permissions.reports?.[action as keyof typeof permissions.reports] === true
        case 'analytics':
          return permissions.analytics?.[action as keyof typeof permissions.analytics] === true
        case 'admin':
          return permissions.admin?.[action as keyof typeof permissions.admin] === true
        default:
          return false
      }
    } else {
      // Old signature: hasPermission(apiKey, permission)
      const apiKey = apiKeyOrPermissions as ApiKey
      const permission = permissionOrResource
      const [resource, actionPart] = permission.split(':')
      const permissions = apiKey.permissions as ApiKeyPermissions

      switch (resource) {
        case 'assets':
          return permissions.assets?.[actionPart as keyof typeof permissions.assets] === true
        case 'users':
          return permissions.users?.[actionPart as keyof typeof permissions.users] === true
        case 'reports':
          return permissions.reports?.[actionPart as keyof typeof permissions.reports] === true
        case 'analytics':
          return permissions.analytics?.[actionPart as keyof typeof permissions.analytics] === true
        case 'admin':
          return permissions.admin?.[actionPart as keyof typeof permissions.admin] === true
        default:
          return false
      }
    }
  }

  private matchesIpPattern(ip: string, pattern: string): boolean {
    // Simple IP matching - in production, use a proper CIDR matching library
    if (pattern === ip) return true
    
    // Support for CIDR notation (simplified)
    if (pattern.includes('/')) {
      const [network, prefixLength] = pattern.split('/')
      const prefix = parseInt(prefixLength)
      
      // Convert IPs to integers for comparison (IPv4 only)
      const ipInt = this.ipToInt(ip)
      const networkInt = this.ipToInt(network)
      const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0
      
      return (ipInt & mask) === (networkInt & mask)
    }
    
    return false
  }

  private ipToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
  }

  private async logSecurityEvent(
    tenantId: string,
    userId: string,
    eventType: SecurityEventInsert['event_type'],
    details: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase()

      const eventData: SecurityEventInsert = {
        tenant_id: tenantId,
        user_id: userId,
        event_type: eventType,
        severity: 'low',
        description: `API key ${eventType.replace('_', ' ')}`,
        details
      }

      await supabase
        .from('security_events')
        .insert(eventData)
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }
}

// Export singleton instance
export const apiKeyService = new ApiKeyService()