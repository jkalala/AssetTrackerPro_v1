// =====================================================
// SESSION MANAGEMENT SERVICE
// =====================================================
// Service for managing user sessions, concurrent limits, and security

import { createClient } from '@/lib/supabase/server'
import { 
  UserSession, 
  UserSessionInsert, 
  SessionActivity,
  SecurityEventInsert
} from '@/lib/types/database'
import * as crypto from 'crypto'
import { UAParser } from 'ua-parser-js'

export interface SessionCreateResult {
  success: boolean
  session?: UserSession
  sessionToken?: string
  refreshToken?: string
  error?: string
}

export interface SessionValidationResult {
  valid: boolean
  session?: UserSession
  requiresRefresh?: boolean
  error?: string
}

export interface DeviceInfo {
  fingerprint: string
  name: string
  type: 'desktop' | 'mobile' | 'tablet' | 'api'
  browser: {
    name?: string
    version?: string
  }
  os: {
    name?: string
    version?: string
  }
}

export interface LocationInfo {
  ip: string
  country?: string
  city?: string
}

export class SessionService {
  private async getSupabase() {
    return createClient()
  }

  // =====================================================
  // SESSION CREATION AND MANAGEMENT
  // =====================================================

  /**
   * Create a new user session
   */
  async createSession(
    tenantId: string,
    userId: string,
    deviceInfo: DeviceInfo,
    locationInfo: LocationInfo,
    userAgent?: string,
    sessionDurationHours: number = 8
  ): Promise<SessionCreateResult> {
    try {
      const supabase = await this.getSupabase()

      // Check concurrent session limits
      const canCreateSession = await this.checkConcurrentSessionLimit(tenantId, userId)
      if (!canCreateSession.allowed) {
        return { success: false, error: canCreateSession.reason }
      }

      // Generate session tokens
      const sessionToken = this.generateSecureToken()
      const refreshToken = this.generateSecureToken()
      const sessionTokenHash = this.hashToken(sessionToken)
      const refreshTokenHash = this.hashToken(refreshToken)

      // Calculate expiration
      const expiresAt = new Date(Date.now() + sessionDurationHours * 60 * 60 * 1000)

      // Create session record
      const sessionData: UserSessionInsert = {
        tenant_id: tenantId,
        user_id: userId,
        session_token_hash: sessionTokenHash,
        refresh_token_hash: refreshTokenHash,
        device_fingerprint: deviceInfo.fingerprint,
        device_name: deviceInfo.name,
        device_type: deviceInfo.type,
        browser_name: deviceInfo.browser.name,
        browser_version: deviceInfo.browser.version,
        os_name: deviceInfo.os.name,
        os_version: deviceInfo.os.version,
        ip_address: locationInfo.ip,
        country_code: locationInfo.country,
        city: locationInfo.city,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString()
      }

      const { data: session, error } = await supabase
        .from('user_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (error) {
        console.error('Error creating session:', error)
        return { success: false, error: error.message }
      }

      // Log session creation activity
      await this.logSessionActivity(
        tenantId,
        session.id,
        'login',
        { device_info: deviceInfo, location_info: locationInfo },
        locationInfo.ip,
        userAgent
      )

      // Log security event
      await this.logSecurityEvent(tenantId, userId, 'login_success', {
        session_id: session.id,
        device_type: deviceInfo.type,
        location: `${locationInfo.city}, ${locationInfo.country}`,
        ip_address: locationInfo.ip
      })

      return {
        success: true,
        session,
        sessionToken,
        refreshToken
      }
    } catch (error) {
      console.error('Error creating session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Validate session token
   */
  async validateSession(sessionToken: string): Promise<SessionValidationResult> {
    try {
      const supabase = await this.getSupabase()
      const tokenHash = this.hashToken(sessionToken)

      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token_hash', tokenHash)
        .eq('is_active', true)
        .single()

      if (error || !session) {
        return { valid: false, error: 'Invalid session token' }
      }

      const now = new Date()
      const expiresAt = new Date(session.expires_at)
      const lastActivity = new Date(session.last_activity_at)

      // Check if session is expired
      if (expiresAt < now) {
        await this.terminateSession(session.id, 'timeout')
        return { valid: false, error: 'Session expired' }
      }

      // Check if session needs refresh (inactive for more than 1 hour)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const requiresRefresh = lastActivity < oneHourAgo

      // Update last activity
      await supabase
        .from('user_sessions')
        .update({ last_activity_at: now.toISOString() })
        .eq('id', session.id)

      return {
        valid: true,
        session,
        requiresRefresh
      }
    } catch (error) {
      console.error('Error validating session:', error)
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Refresh session token
   */
  async refreshSession(
    refreshToken: string,
    sessionDurationHours: number = 8
  ): Promise<SessionCreateResult> {
    try {
      const supabase = await this.getSupabase()
      const tokenHash = this.hashToken(refreshToken)

      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('refresh_token_hash', tokenHash)
        .eq('is_active', true)
        .single()

      if (error || !session) {
        return { success: false, error: 'Invalid refresh token' }
      }

      // Generate new tokens
      const newSessionToken = this.generateSecureToken()
      const newRefreshToken = this.generateSecureToken()
      const newSessionTokenHash = this.hashToken(newSessionToken)
      const newRefreshTokenHash = this.hashToken(newRefreshToken)

      // Update session with new tokens and expiration
      const newExpiresAt = new Date(Date.now() + sessionDurationHours * 60 * 60 * 1000)

      const { data: updatedSession, error: updateError } = await supabase
        .from('user_sessions')
        .update({
          session_token_hash: newSessionTokenHash,
          refresh_token_hash: newRefreshTokenHash,
          expires_at: newExpiresAt.toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', session.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error refreshing session:', updateError)
        return { success: false, error: updateError.message }
      }

      // Log session refresh activity
      await this.logSessionActivity(
        session.tenant_id,
        session.id,
        'action',
        { action: 'session_refresh' },
        session.ip_address,
        session.user_agent
      )

      return {
        success: true,
        session: updatedSession,
        sessionToken: newSessionToken,
        refreshToken: newRefreshToken
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Terminate session
   */
  async terminateSession(
    sessionId: string,
    reason: 'logout' | 'timeout' | 'admin_revoke' | 'security_revoke' | 'concurrent_limit' = 'logout'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      const { data: session, error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          termination_reason: reason
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('Error terminating session:', error)
        return { success: false, error: error.message }
      }

      // Log session termination
      await this.logSessionActivity(
        session.tenant_id,
        sessionId,
        'logout',
        { termination_reason: reason },
        session.ip_address,
        session.user_agent
      )

      // Log security event if not a normal logout
      if (reason !== 'logout') {
        await this.logSecurityEvent(session.tenant_id, session.user_id, 'session_terminated', {
          session_id: sessionId,
          termination_reason: reason
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error terminating session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllUserSessions(
    tenantId: string,
    userId: string,
    excludeSessionId?: string,
    reason: 'admin_revoke' | 'security_revoke' | 'password_change' = 'admin_revoke'
  ): Promise<{ success: boolean; terminatedCount: number; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      let query = supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          termination_reason: reason
        })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (excludeSessionId) {
        query = query.neq('id', excludeSessionId)
      }

      const { data: sessions, error } = await query.select()

      if (error) {
        console.error('Error terminating user sessions:', error)
        return { success: false, terminatedCount: 0, error: error.message }
      }

      // Log security event
      await this.logSecurityEvent(tenantId, userId, 'session_terminated', {
        terminated_sessions: sessions?.length || 0,
        termination_reason: reason,
        excluded_session: excludeSessionId
      })

      return {
        success: true,
        terminatedCount: sessions?.length || 0
      }
    } catch (error) {
      console.error('Error terminating user sessions:', error)
      return {
        success: false,
        terminatedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(
    tenantId: string,
    userId: string,
    currentSessionToken?: string,
    currentIpAddress?: string,
    currentUserAgent?: string
  ): Promise<{ success: boolean; sessions?: UserSession[]; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false })

      if (error) {
        console.error('Error getting user sessions:', error)
        return { success: false, error: error.message }
      }

      // Mark current session using multiple criteria
      let processedSessions = sessions || []
      if (sessions) {
        processedSessions = sessions.map(session => {
          let isCurrent = false
          
          // Primary method: match session token hash
          if (currentSessionToken) {
            const currentTokenHash = this.hashToken(currentSessionToken)
            isCurrent = session.session_token_hash === currentTokenHash
          }
          
          // Fallback method: match IP and user agent for most recent session
          if (!isCurrent && currentIpAddress && currentUserAgent) {
            isCurrent = session.ip_address === currentIpAddress && 
                       session.user_agent === currentUserAgent
          }

          return {
            ...session,
            is_current: isCurrent
          }
        })
      }

      return { success: true, sessions: processedSessions }
    } catch (error) {
      console.error('Error getting user sessions:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get current session by token
   */
  async getCurrentSession(
    sessionToken: string
  ): Promise<{ success: boolean; session?: UserSession; error?: string }> {
    try {
      const supabase = await this.getSupabase()
      const tokenHash = this.hashToken(sessionToken)

      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token_hash', tokenHash)
        .eq('is_active', true)
        .single()

      if (error || !session) {
        return { success: false, error: 'Session not found' }
      }

      return { success: true, session }
    } catch (error) {
      console.error('Error getting current session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if session belongs to user and is terminable
   */
  async canTerminateSession(
    sessionId: string,
    userId: string,
    tenantId: string,
    currentIpAddress?: string,
    currentUserAgent?: string
  ): Promise<{ canTerminate: boolean; reason?: string; isCurrentSession?: boolean }> {
    try {
      const supabase = await this.getSupabase()

      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .single()

      if (error || !session) {
        return { canTerminate: false, reason: 'Session not found' }
      }

      if (session.user_id !== userId) {
        return { canTerminate: false, reason: 'Unauthorized to terminate this session' }
      }

      // Check if this is the current session
      const isCurrentSession = currentIpAddress && currentUserAgent &&
                              session.ip_address === currentIpAddress && 
                              session.user_agent === currentUserAgent

      if (isCurrentSession) {
        return { 
          canTerminate: false, 
          reason: 'Cannot terminate current session. Please log out instead.',
          isCurrentSession: true
        }
      }

      return { canTerminate: true }
    } catch (error) {
      console.error('Error checking session termination:', error)
      return { canTerminate: false, reason: 'Internal error' }
    }
  }

  /**
   * List active sessions for display in UI
   */
  async listActiveSessions(
    tenantId: string,
    userId: string,
    currentIpAddress?: string,
    currentUserAgent?: string
  ): Promise<{ 
    success: boolean; 
    sessions?: Array<{
      id: string;
      device_info: string;
      ip_address: string;
      created_at: string;
      last_activity: string;
      is_current: boolean;
      user_agent?: string;
      location?: string;
    }>; 
    error?: string 
  }> {
    try {
      const result = await this.getUserSessions(
        tenantId,
        userId,
        undefined,
        currentIpAddress,
        currentUserAgent
      )

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      // Transform sessions for UI display
      const transformedSessions = result.sessions?.map(session => {
        // Determine if this is the current session based on IP and user agent
        const isCurrent = currentIpAddress && currentUserAgent && 
          session.ip_address === currentIpAddress && 
          session.user_agent === currentUserAgent

        return {
          id: session.id,
          device_info: session.device_name || 'Unknown Device',
          ip_address: session.ip_address,
          created_at: session.created_at,
          last_activity: session.last_activity_at || session.created_at,
          is_current: isCurrent || false,
          user_agent: session.user_agent,
          location: session.city && session.country_code ? 
            `${session.city}, ${session.country_code}` : undefined
        }
      }) || []

      return {
        success: true,
        sessions: transformedSessions
      }
    } catch (error) {
      console.error('Error listing active sessions:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // SESSION ACTIVITY TRACKING
  // =====================================================

  /**
   * Log session activity
   */
  async logSessionActivity(
    tenantId: string,
    sessionId: string,
    activityType: 'login' | 'logout' | 'api_call' | 'page_view' | 'action' | 'security_event',
    activityDetails: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase()

      const activityData: Omit<SessionActivity, 'id' | 'created_at'> = {
        tenant_id: tenantId,
        session_id: sessionId,
        activity_type: activityType,
        activity_details: activityDetails,
        ip_address: ipAddress,
        user_agent: userAgent
      }

      await supabase
        .from('session_activities')
        .insert(activityData)
    } catch (error) {
      console.error('Error logging session activity:', error)
    }
  }

  // =====================================================
  // CONCURRENT SESSION MANAGEMENT
  // =====================================================

  /**
   * Check concurrent session limits
   */
  async checkConcurrentSessionLimit(
    tenantId: string,
    userId: string,
    maxSessions: number = 5
  ): Promise<{ allowed: boolean; reason?: string; activeCount?: number }> {
    try {
      const supabase = await this.getSupabase()

      // Get tenant's max session setting
      const { data: tenantSetting } = await supabase
        .from('tenant_settings')
        .select('setting_value')
        .eq('tenant_id', tenantId)
        .eq('setting_key', 'max_concurrent_sessions')
        .single()

      const tenantMaxSessions = tenantSetting ? parseInt(tenantSetting.setting_value) : maxSessions

      // Count active sessions
      const { count: activeCount, error } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      if (error) {
        console.error('Error checking session limit:', error)
        return { allowed: true } // Allow on error to prevent lockout
      }

      const currentCount = activeCount || 0

      if (currentCount >= tenantMaxSessions) {
        // Terminate oldest session to make room
        await this.terminateOldestSession(tenantId, userId)
        
        // Log security event
        await this.logSecurityEvent(tenantId, userId, 'concurrent_session_limit', {
          active_sessions: currentCount,
          max_sessions: tenantMaxSessions,
          action: 'terminated_oldest'
        })

        return { allowed: true, activeCount: currentCount - 1 }
      }

      return { allowed: true, activeCount: currentCount }
    } catch (error) {
      console.error('Error checking concurrent session limit:', error)
      return { allowed: true } // Allow on error to prevent lockout
    }
  }

  /**
   * Terminate oldest session for user
   */
  private async terminateOldestSession(tenantId: string, userId: string): Promise<void> {
    try {
      const supabase = await this.getSupabase()

      const { data: oldestSession } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity_at', { ascending: true })
        .limit(1)
        .single()

      if (oldestSession) {
        await this.terminateSession(oldestSession.id, 'concurrent_limit')
      }
    } catch (error) {
      console.error('Error terminating oldest session:', error)
    }
  }

  // =====================================================
  // DEVICE AND LOCATION UTILITIES
  // =====================================================

  /**
   * Parse device information from user agent
   */
  parseDeviceInfo(userAgent: string, customFingerprint?: string): DeviceInfo {
    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    // Generate device fingerprint
    const fingerprint = customFingerprint || this.generateDeviceFingerprint(userAgent, result)

    // Determine device type
    let deviceType: DeviceInfo['type'] = 'desktop'
    if (result.device.type === 'mobile') deviceType = 'mobile'
    else if (result.device.type === 'tablet') deviceType = 'tablet'
    else if (userAgent.includes('API') || userAgent.includes('Bot')) deviceType = 'api'

    // Generate device name
    const deviceName = this.generateDeviceName(result)

    return {
      fingerprint,
      name: deviceName,
      type: deviceType,
      browser: {
        name: result.browser.name,
        version: result.browser.version
      },
      os: {
        name: result.os.name,
        version: result.os.version
      }
    }
  }

  /**
   * Get location information from IP address
   */
  async getLocationInfo(ipAddress: string): Promise<LocationInfo> {
    // In production, integrate with a geolocation service like MaxMind or IPinfo
    // This is a simplified implementation
    return {
      ip: ipAddress,
      country: 'US', // Would be determined by geolocation service
      city: 'Unknown' // Would be determined by geolocation service
    }
  }

  // =====================================================
  // CLEANUP AND MAINTENANCE
  // =====================================================

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<{ success: boolean; cleanedCount: number; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      const { data: expiredSessions, error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          termination_reason: 'timeout'
        })
        .or(`expires_at.lt.${new Date().toISOString()},last_activity_at.lt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`)
        .eq('is_active', true)
        .select('id')

      if (error) {
        console.error('Error cleaning up expired sessions:', error)
        return { success: false, cleanedCount: 0, error: error.message }
      }

      return {
        success: true,
        cleanedCount: expiredSessions?.length || 0
      }
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error)
      return {
        success: false,
        cleanedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('base64url')
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  private generateDeviceFingerprint(userAgent: string, parsedUA: any): string {
    const components = [
      parsedUA.browser.name || '',
      parsedUA.browser.version || '',
      parsedUA.os.name || '',
      parsedUA.os.version || '',
      parsedUA.device.vendor || '',
      parsedUA.device.model || '',
      userAgent.length.toString()
    ]

    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
      .substring(0, 16)
  }

  private generateDeviceName(parsedUA: any): string {
    const parts = []

    if (parsedUA.device.vendor && parsedUA.device.model) {
      parts.push(`${parsedUA.device.vendor} ${parsedUA.device.model}`)
    } else if (parsedUA.os.name) {
      parts.push(parsedUA.os.name)
      if (parsedUA.os.version) {
        parts.push(parsedUA.os.version)
      }
    }

    if (parsedUA.browser.name) {
      parts.push(parsedUA.browser.name)
    }

    return parts.join(' ') || 'Unknown Device'
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
        description: `Session ${eventType.replace('_', ' ')}`,
        details
      }

      await supabase
        .from('security_events')
        .insert(eventData)
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }

  // =====================================================
  // PUBLIC METHODS FOR TESTING
  // =====================================================

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string, userId: string, ipAddress?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase()
      
      const updateData: any = {
        last_activity_at: new Date().toISOString()
      }
      
      if (ipAddress) {
        updateData.ip_address = ipAddress
      }

      const { error } = await supabase
        .from('user_sessions')
        .update(updateData)
        .eq('id', sessionId)
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
   * Get session by ID
   */
  async getSessionById(sessionId: string, userId: string, tenantId?: string): Promise<UserSession | null> {
    try {
      const supabase = await this.getSupabase()
      
      let query = supabase
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      const { data: session, error } = await query.single()

      if (error || !session) {
        return null
      }

      return session
    } catch (error) {
      console.error('Error getting session by ID:', error)
      return null
    }
  }

  /**
   * Parse user agent string to extract device info
   */
  parseUserAgent(userAgent: string): string {
    if (!userAgent) return 'Unknown Device'

    // Simple user agent parsing - in production use a proper library like 'ua-parser-js'
    if (userAgent.includes('Chrome')) {
      return 'Chrome Browser'
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'Safari Browser'
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox Browser'
    } else if (userAgent.includes('Edge')) {
      return 'Edge Browser'
    } else if (userAgent.includes('iPhone')) {
      return 'iPhone Device'
    } else if (userAgent.includes('Android')) {
      return 'Android Device'
    } else {
      return 'Unknown Device'
    }
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(lastActivityAt: string): boolean {
    const lastActivity = new Date(lastActivityAt)
    const now = new Date()
    const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
    
    // Session expires after 24 hours of inactivity
    return hoursSinceActivity > 24
  }
}

// Export singleton instance
export const sessionService = new SessionService()