/**
 * Integration test for session management functionality
 * Tests the requirements from the E2E authentication fixes spec
 */

import { sessionService } from '@/lib/services/session-service'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: [
                {
                  id: 'session-1',
                  device_name: 'Chrome on Windows',
                  ip_address: '192.168.1.100',
                  created_at: '2024-01-01T00:00:00Z',
                  last_activity_at: '2024-01-01T01:00:00Z',
                  user_agent: 'Mozilla/5.0 Chrome',
                  city: 'New York',
                  country_code: 'US',
                  is_current: false
                },
                {
                  id: 'session-2',
                  device_name: 'Safari on iPhone',
                  ip_address: '192.168.1.101',
                  created_at: '2024-01-01T02:00:00Z',
                  last_activity_at: '2024-01-01T03:00:00Z',
                  user_agent: 'Mozilla/5.0 Safari',
                  city: 'Los Angeles',
                  country_code: 'US',
                  is_current: false
                }
              ],
              error: null
            })),
            single: jest.fn(() => ({
              data: {
                id: 'session-1',
                user_id: 'user-123',
                ip_address: '192.168.1.100',
                user_agent: 'Mozilla/5.0 Chrome'
              },
              error: null
            }))
          }))
        }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'session-1' },
            error: null
          }))
        }))
      }))
    }))
  }))
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

describe('Session Management Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Requirement 3.2: List active sessions', () => {
    it('should list active sessions with proper data structure', async () => {
      const result = await sessionService.listActiveSessions(
        'tenant-123',
        'user-123',
        '192.168.1.100',
        'Mozilla/5.0 Chrome'
      )

      expect(result.success).toBe(true)
      expect(result.sessions).toHaveLength(2)
      
      // Verify session data structure matches UI requirements
      const session = result.sessions?.[0]
      expect(session).toHaveProperty('id')
      expect(session).toHaveProperty('device_info')
      expect(session).toHaveProperty('ip_address')
      expect(session).toHaveProperty('created_at')
      expect(session).toHaveProperty('last_activity')
      expect(session).toHaveProperty('is_current')
      expect(session).toHaveProperty('user_agent')
      expect(session).toHaveProperty('location')
    })
  })

  describe('Requirement 3.3: Current session identification', () => {
    it('should correctly identify current session', async () => {
      const result = await sessionService.listActiveSessions(
        'tenant-123',
        'user-123',
        '192.168.1.100',
        'Mozilla/5.0 Chrome'
      )

      expect(result.success).toBe(true)
      
      const currentSession = result.sessions?.find(s => s.is_current)
      expect(currentSession).toBeDefined()
      expect(currentSession?.id).toBe('session-1')
      expect(currentSession?.ip_address).toBe('192.168.1.100')
      expect(currentSession?.user_agent).toBe('Mozilla/5.0 Chrome')
    })

    it('should not mark any session as current if no match', async () => {
      const result = await sessionService.listActiveSessions(
        'tenant-123',
        'user-123',
        '192.168.1.999', // Different IP
        'Different User Agent'
      )

      expect(result.success).toBe(true)
      
      const currentSessions = result.sessions?.filter(s => s.is_current)
      expect(currentSessions).toHaveLength(0)
    })
  })

  describe('Requirement 3.4: Session termination', () => {
    it('should allow terminating other sessions', async () => {
      const result = await sessionService.canTerminateSession(
        'session-1',
        'user-123',
        'tenant-123',
        '192.168.1.101', // Different IP from session
        'Mozilla/5.0 Safari' // Different user agent
      )

      expect(result.canTerminate).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should prevent terminating current session', async () => {
      const result = await sessionService.canTerminateSession(
        'session-1',
        'user-123',
        'tenant-123',
        '192.168.1.100', // Same IP as session
        'Mozilla/5.0 Chrome' // Same user agent
      )

      expect(result.canTerminate).toBe(false)
      expect(result.reason).toBe('Cannot terminate current session. Please log out instead.')
      expect(result.isCurrentSession).toBe(true)
    })

    it('should handle session termination with proper cleanup', async () => {
      const result = await sessionService.terminateSession('session-1', 'admin_revoke')

      expect(result.success).toBe(true)
      
      // Verify the update call was made
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_sessions')
    })
  })

  describe('Requirement 3.6: Session data management', () => {
    it('should format location information correctly', async () => {
      const result = await sessionService.listActiveSessions(
        'tenant-123',
        'user-123'
      )

      expect(result.success).toBe(true)
      
      const sessionWithLocation = result.sessions?.find(s => s.location)
      expect(sessionWithLocation?.location).toBe('New York, US')
    })

    it('should handle sessions without location data', async () => {
      // Mock session without location data
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  data: [{
                    id: 'session-no-location',
                    user_id: 'user-123',
                    device_name: 'Unknown Device',
                    ip_address: '192.168.1.100',
                    created_at: '2024-01-01T00:00:00Z',
                    last_activity_at: '2024-01-01T01:00:00Z',
                    user_agent: 'Mozilla/5.0',
                    city: '',
                    country_code: '',
                    is_current: true
                  }],
                  error: null
                })),
                single: jest.fn(() => ({
                  data: {
                    id: 'session-no-location',
                    user_id: 'user-123',
                    ip_address: '192.168.1.100',
                    user_agent: 'Mozilla/5.0'
                  },
                  error: null
                }))
              }))
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { id: 'session-no-location' },
                error: null
              }))
            }))
          }))
        }))
      })

      const result = await sessionService.listActiveSessions(
        'tenant-123',
        'user-123'
      )

      expect(result.success).toBe(true)
      expect(result.sessions?.[0].location).toBeUndefined()
    })
  })
})