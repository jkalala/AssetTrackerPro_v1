import { SecurityEventService } from '@/lib/services/security-event-service'
import { createClient } from '@/lib/supabase/server'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis()
}

describe('SecurityEventService', () => {
  let service: SecurityEventService

  beforeEach(() => {
    service = new SecurityEventService()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
    jest.clearAllMocks()
  })

  describe('logSecurityEvent', () => {
    it('should log a security event successfully', async () => {
      const mockEvent = {
        id: '123',
        tenant_id: 'tenant-1',
        user_id: 'user-1',
        event_type: 'login_success' as const,
        severity: 'low' as const,
        description: 'Test event',
        details: { test: true },
        created_at: '2024-01-01T00:00:00Z',
        is_resolved: false
      }

      mockSupabase.single.mockResolvedValue({ data: mockEvent, error: null })

      const result = await service.logSecurityEvent({
        tenant_id: 'tenant-1',
        user_id: 'user-1',
        event_type: 'login_success',
        severity: 'low',
        description: 'Test event',
        details: { test: true }
      })

      expect(result).toEqual(mockEvent)
      expect(mockSupabase.from).toHaveBeenCalledWith('security_events')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should handle errors when logging security event', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Database error') })

      const result = await service.logSecurityEvent({
        tenant_id: 'tenant-1',
        event_type: 'login_failure',
        severity: 'medium',
        description: 'Test error'
      })

      expect(result).toBeNull()
    })
  })

  describe('logLoginSuccess', () => {
    it('should log login success event with correct parameters', async () => {
      const mockEvent = {
        id: '123',
        tenant_id: 'tenant-1',
        user_id: 'user-1',
        event_type: 'login_success' as const,
        severity: 'low' as const,
        description: 'User successfully logged in',
        details: { login_method: 'password', timestamp: expect.any(String) },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: '2024-01-01T00:00:00Z',
        is_resolved: false
      }

      mockSupabase.single.mockResolvedValue({ data: mockEvent, error: null })

      const result = await service.logLoginSuccess('user-1', 'tenant-1', {
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        session_id: 'session-1'
      })

      expect(result).toEqual(mockEvent)
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        tenant_id: 'tenant-1',
        user_id: 'user-1',
        event_type: 'login_success',
        severity: 'low',
        description: 'User successfully logged in',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0'
      }))
    })
  })

  describe('logLoginFailure', () => {
    it('should log login failure event with correct parameters', async () => {
      const mockEvent = {
        id: '123',
        tenant_id: 'tenant-1',
        event_type: 'login_failure' as const,
        severity: 'medium' as const,
        description: 'Login attempt failed: Invalid password',
        details: { email: 'test@example.com', reason: 'Invalid password', timestamp: expect.any(String) },
        ip_address: '192.168.1.1',
        created_at: '2024-01-01T00:00:00Z',
        is_resolved: false
      }

      mockSupabase.single.mockResolvedValue({ data: mockEvent, error: null })

      const result = await service.logLoginFailure('tenant-1', {
        email: 'test@example.com',
        ip_address: '192.168.1.1',
        reason: 'Invalid password'
      })

      expect(result).toEqual(mockEvent)
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        tenant_id: 'tenant-1',
        event_type: 'login_failure',
        severity: 'medium',
        description: 'Login attempt failed: Invalid password'
      }))
    })
  })

  describe('logMfaSuccess', () => {
    it('should log MFA success event', async () => {
      const mockEvent = {
        id: '123',
        tenant_id: 'tenant-1',
        user_id: 'user-1',
        event_type: 'mfa_success' as const,
        severity: 'low' as const,
        description: 'Multi-factor authentication successful',
        details: { mfa_method: 'totp', timestamp: expect.any(String) },
        created_at: '2024-01-01T00:00:00Z',
        is_resolved: false
      }

      mockSupabase.single.mockResolvedValue({ data: mockEvent, error: null })

      const result = await service.logMfaSuccess('user-1', 'tenant-1', {
        session_id: 'session-1',
        mfa_method: 'totp'
      })

      expect(result).toEqual(mockEvent)
    })
  })

  describe('logMfaFailure', () => {
    it('should log MFA failure event', async () => {
      const mockEvent = {
        id: '123',
        tenant_id: 'tenant-1',
        user_id: 'user-1',
        event_type: 'mfa_failure' as const,
        severity: 'high' as const,
        description: 'Multi-factor authentication failed: Invalid code',
        details: { mfa_method: 'totp', reason: 'Invalid code', timestamp: expect.any(String) },
        created_at: '2024-01-01T00:00:00Z',
        is_resolved: false
      }

      mockSupabase.single.mockResolvedValue({ data: mockEvent, error: null })

      const result = await service.logMfaFailure('user-1', 'tenant-1', {
        reason: 'Invalid code'
      })

      expect(result).toEqual(mockEvent)
    })
  })

  describe('getSecurityEvents', () => {
    it('should fetch security events with filters', async () => {
      const mockEvents = [
        {
          id: '1',
          tenant_id: 'tenant-1',
          event_type: 'login_success',
          severity: 'low',
          description: 'Login success',
          created_at: '2024-01-01T00:00:00Z',
          is_resolved: false
        }
      ]

      // Mock the final query result
      mockSupabase.limit.mockResolvedValue({ 
        data: mockEvents, 
        error: null, 
        count: 1 
      })

      const result = await service.getSecurityEvents({
        eventType: 'login_success',
        tenantId: 'tenant-1',
        limit: 10
      })

      expect(result.events).toEqual(mockEvents)
      expect(result.total).toBe(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('security_events')
      expect(mockSupabase.eq).toHaveBeenCalledWith('event_type', 'login_success')
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1')
      expect(mockSupabase.limit).toHaveBeenCalledWith(10)
    })

    it('should handle date range filters', async () => {
      // Mock the order method to return the final result since no limit is specified
      mockSupabase.order.mockResolvedValue({ 
        data: [], 
        error: null, 
        count: 0 
      })

      await service.getSecurityEvents({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31'
      })

      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', '2024-01-01')
      expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', '2024-01-31')
    })
  })

  describe('getEventStatistics', () => {
    it('should return event statistics', async () => {
      const mockEvents = [
        {
          id: '1',
          event_type: 'login_success',
          severity: 'low',
          is_resolved: false,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          event_type: 'login_failure',
          severity: 'medium',
          is_resolved: true,
          created_at: '2024-01-02T00:00:00Z'
        }
      ]

      mockSupabase.eq.mockResolvedValue({ data: mockEvents, error: null })

      const result = await service.getEventStatistics('tenant-1')

      expect(result.totalEvents).toBe(2)
      expect(result.eventsByType).toEqual({
        'login_success': 1,
        'login_failure': 1
      })
      expect(result.eventsBySeverity).toEqual({
        'low': 1,
        'medium': 1
      })
      expect(result.unresolvedEvents).toBe(1)
      expect(result.recentEvents).toHaveLength(2)
    })
  })

  describe('resolveSecurityEvent', () => {
    it('should resolve a security event', async () => {
      mockSupabase.eq.mockResolvedValue({ error: null })

      const result = await service.resolveSecurityEvent('event-1', 'admin-1', 'Resolved manually')

      expect(result).toBe(true)
      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_resolved: true,
        resolved_at: expect.any(String),
        resolved_by: 'admin-1',
        resolution_notes: 'Resolved manually'
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'event-1')
    })
  })

  describe('bulkResolveEvents', () => {
    it('should bulk resolve multiple events', async () => {
      mockSupabase.in.mockResolvedValue({ error: null })

      const result = await service.bulkResolveEvents(['event-1', 'event-2'], 'admin-1', 'Bulk resolved')

      expect(result).toBe(true)
      expect(mockSupabase.in).toHaveBeenCalledWith('id', ['event-1', 'event-2'])
    })
  })

  describe('getUserSecurityEvents', () => {
    it('should fetch events for a specific user', async () => {
      const mockEvents = [
        {
          id: '1',
          user_id: 'user-1',
          tenant_id: 'tenant-1',
          event_type: 'login_success',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.limit.mockResolvedValue({ data: mockEvents, error: null })

      const result = await service.getUserSecurityEvents('user-1', 'tenant-1', 25)

      expect(result).toEqual(mockEvents)
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1')
      expect(mockSupabase.limit).toHaveBeenCalledWith(25)
    })
  })

  describe('getEventTypes', () => {
    it('should return all available event types', async () => {
      const eventTypes = await service.getEventTypes()

      expect(eventTypes).toContain('login_success')
      expect(eventTypes).toContain('login_failure')
      expect(eventTypes).toContain('mfa_success')
      expect(eventTypes).toContain('mfa_failure')
      expect(eventTypes).toContain('api_key_created')
      expect(eventTypes).toContain('session_terminated')
      expect(eventTypes.length).toBeGreaterThan(0)
    })
  })
})