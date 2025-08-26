import { createClient } from '@/lib/supabase/server'
import { SecurityEvent, SecurityEventInsert } from '@/lib/types/database'

export class SecurityEventService {

  // Helper method to log login success events
  async logLoginSuccess(userId: string, tenantId: string, metadata: {
    ip_address?: string
    user_agent?: string
    location_country?: string
    location_city?: string
    session_id?: string
  }): Promise<SecurityEvent | null> {
    return this.logSecurityEvent({
      tenant_id: tenantId,
      user_id: userId,
      session_id: metadata.session_id,
      event_type: 'login_success',
      severity: 'low',
      description: 'User successfully logged in',
      details: {
        login_method: 'password',
        timestamp: new Date().toISOString()
      },
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
      location_country: metadata.location_country,
      location_city: metadata.location_city
    })
  }

  // Helper method to log login failure events
  async logLoginFailure(tenantId: string, metadata: {
    email?: string
    ip_address?: string
    user_agent?: string
    location_country?: string
    location_city?: string
    reason?: string
  }): Promise<SecurityEvent | null> {
    return this.logSecurityEvent({
      tenant_id: tenantId,
      event_type: 'login_failure',
      severity: 'medium',
      description: `Login attempt failed${metadata.reason ? `: ${metadata.reason}` : ''}`,
      details: {
        email: metadata.email,
        reason: metadata.reason || 'Invalid credentials',
        timestamp: new Date().toISOString()
      },
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
      location_country: metadata.location_country,
      location_city: metadata.location_city
    })
  }

  // Helper method to log MFA success events
  async logMfaSuccess(userId: string, tenantId: string, metadata: {
    ip_address?: string
    user_agent?: string
    session_id?: string
    mfa_method?: string
  }): Promise<SecurityEvent | null> {
    return this.logSecurityEvent({
      tenant_id: tenantId,
      user_id: userId,
      session_id: metadata.session_id,
      event_type: 'mfa_success',
      severity: 'low',
      description: 'Multi-factor authentication successful',
      details: {
        mfa_method: metadata.mfa_method || 'totp',
        timestamp: new Date().toISOString()
      },
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent
    })
  }

  // Helper method to log MFA failure events
  async logMfaFailure(userId: string, tenantId: string, metadata: {
    ip_address?: string
    user_agent?: string
    session_id?: string
    mfa_method?: string
    reason?: string
  }): Promise<SecurityEvent | null> {
    return this.logSecurityEvent({
      tenant_id: tenantId,
      user_id: userId,
      session_id: metadata.session_id,
      event_type: 'mfa_failure',
      severity: 'high',
      description: `Multi-factor authentication failed${metadata.reason ? `: ${metadata.reason}` : ''}`,
      details: {
        mfa_method: metadata.mfa_method || 'totp',
        reason: metadata.reason || 'Invalid code',
        timestamp: new Date().toISOString()
      },
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent
    })
  }

  // Helper method to log API key creation events
  async logApiKeyCreated(userId: string, tenantId: string, metadata: {
    api_key_name: string
    permissions: Record<string, unknown>
    ip_address?: string
    user_agent?: string
  }): Promise<SecurityEvent | null> {
    return this.logSecurityEvent({
      tenant_id: tenantId,
      user_id: userId,
      event_type: 'api_key_created',
      severity: 'medium',
      description: `API key created: ${metadata.api_key_name}`,
      details: {
        api_key_name: metadata.api_key_name,
        permissions: metadata.permissions,
        timestamp: new Date().toISOString()
      },
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent
    })
  }

  // Helper method to log session termination events
  async logSessionTerminated(userId: string, tenantId: string, metadata: {
    session_id: string
    terminated_by?: string
    reason?: string
    ip_address?: string
    user_agent?: string
  }): Promise<SecurityEvent | null> {
    return this.logSecurityEvent({
      tenant_id: tenantId,
      user_id: userId,
      session_id: metadata.session_id,
      event_type: 'session_terminated',
      severity: 'low',
      description: `Session terminated${metadata.reason ? `: ${metadata.reason}` : ''}`,
      details: {
        terminated_by: metadata.terminated_by || userId,
        reason: metadata.reason || 'User logout',
        timestamp: new Date().toISOString()
      },
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent
    })
  }

  async logSecurityEvent(event: SecurityEventInsert): Promise<SecurityEvent | null> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('security_events')
        .insert(event)
        .select()
        .single()

      if (error) {
        console.error('Error logging security event:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error logging security event:', error)
      return null
    }
  }

  async getSecurityEvents(filters?: {
    eventType?: string
    userId?: string
    severity?: string
    tenantId?: string
    dateFrom?: string
    dateTo?: string
    isResolved?: boolean
    limit?: number
    offset?: number
  }): Promise<{ events: SecurityEvent[], total: number }> {
    try {
      const supabase = await createClient()
      let query = supabase
        .from('security_events')
        .select('*, profiles(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters?.eventType && filters.eventType !== 'all') {
        query = query.eq('event_type', filters.eventType)
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters?.severity) {
        query = query.eq('severity', filters.severity)
      }

      if (filters?.tenantId) {
        query = query.eq('tenant_id', filters.tenantId)
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      if (filters?.isResolved !== undefined) {
        query = query.eq('is_resolved', filters.isResolved)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching security events:', error)
        return { events: [], total: 0 }
      }

      return { events: data || [], total: count || 0 }
    } catch (error) {
      console.error('Error fetching security events:', error)
      return { events: [], total: 0 }
    }
  }

  async getEventTypes(): Promise<string[]> {
    return [
      'login_success',
      'login_failure',
      'mfa_success',
      'mfa_failure',
      'password_change',
      'account_locked',
      'account_unlocked',
      'suspicious_activity',
      'api_key_created',
      'api_key_revoked',
      'session_terminated',
      'concurrent_session_limit'
    ]
  }

  // Get event statistics for dashboard/analytics
  async getEventStatistics(tenantId: string, dateFrom?: string, dateTo?: string): Promise<{
    totalEvents: number
    eventsByType: Record<string, number>
    eventsBySeverity: Record<string, number>
    recentEvents: SecurityEvent[]
    unresolvedEvents: number
  }> {
    try {
      const supabase = await createClient()
      
      // Base query with tenant filtering
      let baseQuery = supabase
        .from('security_events')
        .select('*')
        .eq('tenant_id', tenantId)

      if (dateFrom) {
        baseQuery = baseQuery.gte('created_at', dateFrom)
      }

      if (dateTo) {
        baseQuery = baseQuery.lte('created_at', dateTo)
      }

      const { data: events, error } = await baseQuery

      if (error) {
        console.error('Error fetching event statistics:', error)
        return {
          totalEvents: 0,
          eventsByType: {},
          eventsBySeverity: {},
          recentEvents: [],
          unresolvedEvents: 0
        }
      }

      const eventsByType: Record<string, number> = {}
      const eventsBySeverity: Record<string, number> = {}
      let unresolvedEvents = 0

      events?.forEach(event => {
        // Count by type
        eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1
        
        // Count by severity
        eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1
        
        // Count unresolved
        if (!event.is_resolved) {
          unresolvedEvents++
        }
      })

      // Get recent events (last 10)
      const recentEvents = events
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10) || []

      return {
        totalEvents: events?.length || 0,
        eventsByType,
        eventsBySeverity,
        recentEvents,
        unresolvedEvents
      }
    } catch (error) {
      console.error('Error fetching event statistics:', error)
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        recentEvents: [],
        unresolvedEvents: 0
      }
    }
  }

  // Get events for a specific user
  async getUserSecurityEvents(userId: string, tenantId: string, limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching user security events:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching user security events:', error)
      return []
    }
  }

  // Bulk resolve events
  async bulkResolveEvents(eventIds: string[], resolvedBy: string, notes?: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from('security_events')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          resolution_notes: notes
        })
        .in('id', eventIds)

      if (error) {
        console.error('Error bulk resolving security events:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error bulk resolving security events:', error)
      return false
    }
  }

  async resolveSecurityEvent(eventId: string, resolvedBy: string, notes?: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from('security_events')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          resolution_notes: notes
        })
        .eq('id', eventId)

      if (error) {
        console.error('Error resolving security event:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error resolving security event:', error)
      return false
    }
  }
}

export const securityEventService = new SecurityEventService()