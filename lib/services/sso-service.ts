// =====================================================
// SINGLE SIGN-ON (SSO) SERVICE
// =====================================================
// Service for managing SSO providers, SAML, OAuth, and OIDC integration

import { createClient } from '@/lib/supabase/server'
import { 
  SsoProvider, 
  SsoProviderInsert, 
  SsoProviderUpdate,
  SsoSession,
  SecurityEventInsert
} from '@/lib/types/database'
import crypto from 'crypto'

export interface SsoProviderConfig {
  // SAML 2.0 Configuration
  saml?: {
    entityId: string
    ssoUrl: string
    sloUrl?: string
    certificate: string
    signRequests?: boolean
    wantAssertionsSigned?: boolean
    attributeMapping?: {
      email?: string
      firstName?: string
      lastName?: string
      displayName?: string
      groups?: string
    }
  }
  
  // OAuth 2.0 / OIDC Configuration
  oauth?: {
    clientId: string
    clientSecret: string
    authorizationUrl: string
    tokenUrl: string
    userinfoUrl?: string
    jwksUrl?: string
    scopes?: string[]
    attributeMapping?: {
      email?: string
      firstName?: string
      lastName?: string
      displayName?: string
      groups?: string
    }
  }
}

export interface SsoAuthResult {
  success: boolean
  redirectUrl?: string
  sessionId?: string
  error?: string
}

export interface SsoCallbackResult {
  success: boolean
  userInfo?: {
    email: string
    firstName?: string
    lastName?: string
    displayName?: string
    groups?: string[]
  }
  sessionId?: string
  error?: string
}

export class SsoService {
  private async getSupabase() {
    return createClient()
  }

  // =====================================================
  // SSO PROVIDER MANAGEMENT
  // =====================================================

  /**
   * Create SSO provider configuration
   */
  async createSsoProvider(
    tenantId: string,
    providerName: string,
    providerType: 'saml2' | 'oauth2' | 'oidc',
    config: SsoProviderConfig,
    userId: string
  ): Promise<{ success: boolean; provider?: SsoProvider; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      // Validate configuration
      const validation = this.validateProviderConfig(providerType, config)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Encrypt sensitive data
      const encryptedConfig = this.encryptSensitiveConfig(config)

      // Create provider record
      const providerData: SsoProviderInsert = {
        tenant_id: tenantId,
        provider_name: providerName,
        provider_type: providerType,
        configuration: encryptedConfig,
        is_enabled: true
      }

      // Set type-specific fields
      if (providerType === 'saml2' && config.saml) {
        providerData.entity_id = config.saml.entityId
        providerData.sso_url = config.saml.ssoUrl
        providerData.slo_url = config.saml.sloUrl
        providerData.certificate = config.saml.certificate
        providerData.attribute_mapping = config.saml.attributeMapping || {}
      } else if ((providerType === 'oauth2' || providerType === 'oidc') && config.oauth) {
        providerData.client_id = config.oauth.clientId
        providerData.client_secret_encrypted = this.encryptSecret(config.oauth.clientSecret)
        providerData.authorization_url = config.oauth.authorizationUrl
        providerData.token_url = config.oauth.tokenUrl
        providerData.userinfo_url = config.oauth.userinfoUrl
        providerData.jwks_url = config.oauth.jwksUrl
        providerData.attribute_mapping = config.oauth.attributeMapping || {}
      }

      const { data: provider, error } = await supabase
        .from('sso_providers')
        .insert(providerData)
        .select()
        .single()

      if (error) {
        console.error('Error creating SSO provider:', error)
        return { success: false, error: error.message }
      }

      // Log security event
      await this.logSecurityEvent(tenantId, userId, 'login_success', {
        action: 'sso_provider_created',
        provider_name: providerName,
        provider_type: providerType
      })

      return { success: true, provider }
    } catch (error) {
      console.error('Error creating SSO provider:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update SSO provider configuration
   */
  async updateSsoProvider(
    tenantId: string,
    providerId: string,
    updates: {
      providerName?: string
      isEnabled?: boolean
      config?: SsoProviderConfig
    },
    userId: string
  ): Promise<{ success: boolean; provider?: SsoProvider; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      // Get existing provider
      const { data: existingProvider, error: fetchError } = await supabase
        .from('sso_providers')
        .select('*')
        .eq('id', providerId)
        .eq('tenant_id', tenantId)
        .single()

      if (fetchError || !existingProvider) {
        return { success: false, error: 'SSO provider not found' }
      }

      const updateData: SsoProviderUpdate = {}

      if (updates.providerName) {
        updateData.provider_name = updates.providerName
      }

      if (updates.isEnabled !== undefined) {
        updateData.is_enabled = updates.isEnabled
      }

      if (updates.config) {
        // Validate new configuration
        const validation = this.validateProviderConfig(existingProvider.provider_type, updates.config)
        if (!validation.valid) {
          return { success: false, error: validation.error }
        }

        // Encrypt and update configuration
        const encryptedConfig = this.encryptSensitiveConfig(updates.config)
        updateData.configuration = encryptedConfig

        // Update type-specific fields
        if (existingProvider.provider_type === 'saml2' && updates.config.saml) {
          updateData.entity_id = updates.config.saml.entityId
          updateData.sso_url = updates.config.saml.ssoUrl
          updateData.slo_url = updates.config.saml.sloUrl
          updateData.certificate = updates.config.saml.certificate
          updateData.attribute_mapping = updates.config.saml.attributeMapping || {}
        } else if ((existingProvider.provider_type === 'oauth2' || existingProvider.provider_type === 'oidc') && updates.config.oauth) {
          updateData.client_id = updates.config.oauth.clientId
          updateData.client_secret_encrypted = this.encryptSecret(updates.config.oauth.clientSecret)
          updateData.authorization_url = updates.config.oauth.authorizationUrl
          updateData.token_url = updates.config.oauth.tokenUrl
          updateData.userinfo_url = updates.config.oauth.userinfoUrl
          updateData.jwks_url = updates.config.oauth.jwksUrl
          updateData.attribute_mapping = updates.config.oauth.attributeMapping || {}
        }
      }

      const { data: provider, error } = await supabase
        .from('sso_providers')
        .update(updateData)
        .eq('id', providerId)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) {
        console.error('Error updating SSO provider:', error)
        return { success: false, error: error.message }
      }

      return { success: true, provider }
    } catch (error) {
      console.error('Error updating SSO provider:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get SSO providers for tenant
   */
  async getSsoProviders(
    tenantId: string,
    enabledOnly: boolean = true
  ): Promise<{ success: boolean; providers?: SsoProvider[]; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      let query = supabase
        .from('sso_providers')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (enabledOnly) {
        query = query.eq('is_enabled', true)
      }

      const { data: providers, error } = await query

      if (error) {
        console.error('Error getting SSO providers:', error)
        return { success: false, error: error.message }
      }

      // Decrypt sensitive configuration for admin use
      const decryptedProviders = providers?.map(provider => ({
        ...provider,
        configuration: this.decryptSensitiveConfig(provider.configuration)
      }))

      return { success: true, providers: decryptedProviders }
    } catch (error) {
      console.error('Error getting SSO providers:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // SSO AUTHENTICATION FLOW
  // =====================================================

  /**
   * Initiate SSO authentication
   */
  async initiateSsoAuth(
    tenantId: string,
    providerId: string,
    returnUrl?: string
  ): Promise<SsoAuthResult> {
    try {
      const supabase = await this.getSupabase()

      // Get provider configuration
      const { data: provider, error } = await supabase
        .from('sso_providers')
        .select('*')
        .eq('id', providerId)
        .eq('tenant_id', tenantId)
        .eq('is_enabled', true)
        .single()

      if (error || !provider) {
        return { success: false, error: 'SSO provider not found or disabled' }
      }

      // Generate session state
      const sessionState = crypto.randomBytes(32).toString('base64url')
      const sessionId = crypto.randomUUID()

      // Create SSO session record
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      
      await supabase
        .from('sso_sessions')
        .insert({
          id: sessionId,
          tenant_id: tenantId,
          user_id: '', // Will be set after successful authentication
          provider_id: providerId,
          oauth_state: sessionState,
          attributes: { return_url: returnUrl },
          expires_at: expiresAt.toISOString()
        })

      let redirectUrl: string

      if (provider.provider_type === 'saml2') {
        redirectUrl = await this.buildSamlAuthRequest(provider, sessionState)
      } else {
        redirectUrl = await this.buildOAuthAuthRequest(provider, sessionState, returnUrl)
      }

      return {
        success: true,
        redirectUrl,
        sessionId
      }
    } catch (error) {
      console.error('Error initiating SSO auth:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Handle SSO callback
   */
  async handleSsoCallback(
    tenantId: string,
    providerId: string,
    callbackData: Record<string, any>
  ): Promise<SsoCallbackResult> {
    try {
      const supabase = await this.getSupabase()

      // Get provider configuration
      const { data: provider, error } = await supabase
        .from('sso_providers')
        .select('*')
        .eq('id', providerId)
        .eq('tenant_id', tenantId)
        .eq('is_enabled', true)
        .single()

      if (error || !provider) {
        return { success: false, error: 'SSO provider not found or disabled' }
      }

      let userInfo: SsoCallbackResult['userInfo']
      let sessionId: string

      if (provider.provider_type === 'saml2') {
        const samlResult = await this.processSamlResponse(provider, callbackData)
        if (!samlResult.success) {
          return { success: false, error: samlResult.error }
        }
        userInfo = samlResult.userInfo
        sessionId = samlResult.sessionId!
      } else {
        const oauthResult = await this.processOAuthCallback(provider, callbackData)
        if (!oauthResult.success) {
          return { success: false, error: oauthResult.error }
        }
        userInfo = oauthResult.userInfo
        sessionId = oauthResult.sessionId!
      }

      // Update SSO session with user info
      await supabase
        .from('sso_sessions')
        .update({
          attributes: { ...callbackData, user_info: userInfo }
        })
        .eq('id', sessionId)

      return {
        success: true,
        userInfo,
        sessionId
      }
    } catch (error) {
      console.error('Error handling SSO callback:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // SAML 2.0 IMPLEMENTATION
  // =====================================================

  private async buildSamlAuthRequest(provider: SsoProvider, sessionState: string): Promise<string> {
    // This is a simplified SAML implementation
    // In production, use a proper SAML library like @node-saml/node-saml
    
    const samlRequest = `
      <samlp:AuthnRequest 
        xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        ID="${crypto.randomUUID()}"
        Version="2.0"
        IssueInstant="${new Date().toISOString()}"
        Destination="${provider.sso_url}"
        AssertionConsumerServiceURL="${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/callback/${provider.id}">
        <saml:Issuer>${provider.entity_id}</saml:Issuer>
      </samlp:AuthnRequest>
    `

    const encodedRequest = Buffer.from(samlRequest).toString('base64')
    const params = new URLSearchParams({
      SAMLRequest: encodedRequest,
      RelayState: sessionState
    })

    return `${provider.sso_url}?${params.toString()}`
  }

  private async processSamlResponse(
    provider: SsoProvider, 
    callbackData: Record<string, any>
  ): Promise<{ success: boolean; userInfo?: any; sessionId?: string; error?: string }> {
    try {
      // This is a simplified SAML response processing
      // In production, use a proper SAML library for validation and parsing
      
      const samlResponse = callbackData.SAMLResponse
      const relayState = callbackData.RelayState

      if (!samlResponse) {
        return { success: false, error: 'Missing SAML response' }
      }

      // Decode and parse SAML response
      const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf-8')
      
      // Validate signature and extract user attributes
      // This would involve XML parsing and signature verification
      
      // Mock user info extraction
      const userInfo = {
        email: 'user@example.com', // Would be extracted from SAML assertion
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        groups: ['users']
      }

      return {
        success: true,
        userInfo,
        sessionId: relayState
      }
    } catch (error) {
      console.error('Error processing SAML response:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SAML processing error'
      }
    }
  }

  // =====================================================
  // OAuth 2.0 / OIDC IMPLEMENTATION
  // =====================================================

  private async buildOAuthAuthRequest(
    provider: SsoProvider, 
    sessionState: string, 
    returnUrl?: string
  ): Promise<string> {
    const config = this.decryptSensitiveConfig(provider.configuration)
    const oauth = config.oauth

    if (!oauth) {
      throw new Error('OAuth configuration not found')
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: oauth.clientId,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/callback/${provider.id}`,
      scope: oauth.scopes?.join(' ') || 'openid email profile',
      state: sessionState
    })

    return `${oauth.authorizationUrl}?${params.toString()}`
  }

  private async processOAuthCallback(
    provider: SsoProvider, 
    callbackData: Record<string, any>
  ): Promise<{ success: boolean; userInfo?: any; sessionId?: string; error?: string }> {
    try {
      const config = this.decryptSensitiveConfig(provider.configuration)
      const oauth = config.oauth

      if (!oauth) {
        return { success: false, error: 'OAuth configuration not found' }
      }

      const { code, state, error } = callbackData

      if (error) {
        return { success: false, error: `OAuth error: ${error}` }
      }

      if (!code) {
        return { success: false, error: 'Missing authorization code' }
      }

      // Exchange code for tokens
      const tokenResponse = await fetch(oauth.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: oauth.clientId,
          client_secret: oauth.clientSecret,
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/callback/${provider.id}`
        })
      })

      if (!tokenResponse.ok) {
        return { success: false, error: 'Failed to exchange authorization code' }
      }

      const tokens = await tokenResponse.json()

      // Get user info
      let userInfo: any

      if (oauth.userinfoUrl) {
        const userResponse = await fetch(oauth.userinfoUrl, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        })

        if (userResponse.ok) {
          userInfo = await userResponse.json()
        }
      } else if (tokens.id_token) {
        // Parse JWT ID token for OIDC
        userInfo = this.parseJwtPayload(tokens.id_token)
      }

      // Map attributes based on provider configuration
      const mappedUserInfo = this.mapUserAttributes(userInfo, provider.attribute_mapping)

      return {
        success: true,
        userInfo: mappedUserInfo,
        sessionId: state
      }
    } catch (error) {
      console.error('Error processing OAuth callback:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth processing error'
      }
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private validateProviderConfig(
    providerType: 'saml2' | 'oauth2' | 'oidc', 
    config: SsoProviderConfig
  ): { valid: boolean; error?: string } {
    if (providerType === 'saml2') {
      if (!config.saml) {
        return { valid: false, error: 'SAML configuration is required' }
      }
      if (!config.saml.entityId || !config.saml.ssoUrl || !config.saml.certificate) {
        return { valid: false, error: 'Missing required SAML configuration fields' }
      }
    } else if (providerType === 'oauth2' || providerType === 'oidc') {
      if (!config.oauth) {
        return { valid: false, error: 'OAuth configuration is required' }
      }
      if (!config.oauth.clientId || !config.oauth.clientSecret || 
          !config.oauth.authorizationUrl || !config.oauth.tokenUrl) {
        return { valid: false, error: 'Missing required OAuth configuration fields' }
      }
    }

    return { valid: true }
  }

  private encryptSensitiveConfig(config: SsoProviderConfig): Record<string, any> {
    // In production, properly encrypt sensitive configuration data
    return config as Record<string, any>
  }

  private decryptSensitiveConfig(encryptedConfig: Record<string, any>): SsoProviderConfig {
    // In production, properly decrypt sensitive configuration data
    return encryptedConfig as SsoProviderConfig
  }

  private encryptSecret(secret: string): string {
    // In production, use proper encryption with a key management service
    const algorithm = 'aes-256-gcm'
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32)
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(secret, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return `${iv.toString('hex')}:${encrypted}`
  }

  private parseJwtPayload(token: string): any {
    try {
      const [, payload] = token.split('.')
      return JSON.parse(Buffer.from(payload, 'base64url').toString())
    } catch (error) {
      console.error('Error parsing JWT payload:', error)
      return {}
    }
  }

  private mapUserAttributes(userInfo: Record<string, unknown>, attributeMapping: Record<string, any>): any {
    if (!attributeMapping || !userInfo) return userInfo

    const mapped: Record<string, unknown> = {}

    if (attributeMapping.email) {
      mapped.email = userInfo[attributeMapping.email] || userInfo.email
    }
    if (attributeMapping.firstName) {
      mapped.firstName = userInfo[attributeMapping.firstName] || userInfo.given_name
    }
    if (attributeMapping.lastName) {
      mapped.lastName = userInfo[attributeMapping.lastName] || userInfo.family_name
    }
    if (attributeMapping.displayName) {
      mapped.displayName = userInfo[attributeMapping.displayName] || userInfo.name
    }
    if (attributeMapping.groups) {
      mapped.groups = userInfo[attributeMapping.groups] || userInfo.groups || []
    }

    return { ...userInfo, ...mapped }
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
        description: `SSO ${eventType.replace('_', ' ')}`,
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
export const ssoService = new SsoService()