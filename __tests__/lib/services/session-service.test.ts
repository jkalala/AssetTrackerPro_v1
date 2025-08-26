/* eslint-disable @typescript-eslint/no-require-imports */
import { sessionService, type DeviceInfo, type LocationInfo } from '@/lib/services/session-service'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
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
              }))
            }))
          }))
        }))
      }))
    }))
  }))
}))

describe('SessionService', () => {
  describe('listActiveSessions', () => {
    it('should list active sessions with proper formatting', async () => {
      const result = await sessionService.listActiveSessions(
        'tenant-123',
        'user-123',
        '192.168.1.100',
        'Mozilla/5.0 Chrome'
      )

      expect(result.success).toBe(true)
      expect(result.sessions).toHaveLength(2)
      
      const session1 = result.sessions?.[0]
      expect(session1).toEqual({
        id: 'session-1',
        device_info: 'Chrome on Windows',
        ip_address: '192.168.1.100',
        created_at: '2024-01-01T00:00:00Z',
        last_activity: '2024-01-01T01:00:00Z',
        is_current: true, // Should be marked as current due to IP/UA match
        user_agent: 'Mozilla/5.0 Chrome',
        location: 'New York, US'
      })
    })

    it('should identify current session correctly', async () => {
      const result = await sessionService.listActiveSessions(
        'tenant-123',
        'user-123',
        '192.168.1.101',
        'Mozilla/5.0 Safari'
      )

      expect(result.success).toBe(true)
      
      const currentSession = result.sessions?.find(s => s.is_current)
      expect(currentSession?.id).toBe('session-2')
      expect(currentSession?.device_info).toBe('Safari on iPhone')
    })
  })

  describe('canTerminateSession', () => {
    it('should prevent terminating current session', async () => {
      // Mock the session lookup
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
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
          }))
        }))
      }

      // Mock the createClient function for this test
      const originalCreateClient = require('@/lib/supabase/server').createClient
      require('@/lib/supabase/server').createClient = jest.fn(() => mockSupabase)

      const result = await sessionService.canTerminateSession(
        'session-1',
        'user-123',
        'tenant-123',
        '192.168.1.100',
        'Mozilla/5.0 Chrome'
      )

      expect(result.canTerminate).toBe(false)
      expect(result.reason).toBe('Cannot terminate current session. Please log out instead.')
      expect(result.isCurrentSession).toBe(true)

      // Restore original mock
      require('@/lib/supabase/server').createClient = originalCreateClient
    })

    it('should allow terminating other sessions', async () => {
      // Mock the session lookup
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
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
          }))
        }))
      }

      // Mock the createClient function for this test
      const originalCreateClient = require('@/lib/supabase/server').createClient
      require('@/lib/supabase/server').createClient = jest.fn(() => mockSupabase)

      const result = await sessionService.canTerminateSession(
        'session-1',
        'user-123',
        'tenant-123',
        '192.168.1.101', // Different IP
        'Mozilla/5.0 Safari' // Different user agent
      )

      expect(result.canTerminate).toBe(true)
      expect(result.reason).toBeUndefined()
      expect(result.isCurrentSession).toBeFalsy()

      // Restore original mock
      require('@/lib/supabase/server').createClient = originalCreateClient
    })
  })

  describe('terminateSession', () => {
    it('should terminate session successfully', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: { id: 'session-1', user_id: 'user-123' },
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      }

      const originalCreateClient = require('@/lib/supabase/server').createClient
      require('@/lib/supabase/server').createClient = jest.fn(() => mockSupabase)

      const result = await sessionService.terminateSession(
        'session-1',
        'logout'
      )

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('user_sessions')

      require('@/lib/supabase/server').createClient = originalCreateClient
    })

    it('should handle termination errors', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: null,
                    error: { message: 'Session not found' }
                  }))
                }))
              }))
            }))
          }))
        }))
      }

      const originalCreateClient = require('@/lib/supabase/server').createClient
      require('@/lib/supabase/server').createClient = jest.fn(() => mockSupabase)

      const result = await sessionService.terminateSession(
        'nonexistent',
        'logout'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session not found')

      require('@/lib/supabase/server').createClient = originalCreateClient
    })
  })

  describe('createSession', () => {
    it('should create new session successfully', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'new-session-id',
                  user_id: 'user-123',
                  tenant_id: 'tenant-123',
                  device_name: 'Chrome on Windows',
                  ip_address: '192.168.1.100',
                  created_at: '2024-01-01T00:00:00Z'
                },
                error: null
              }))
            }))
          }))
        }))
      }

      const originalCreateClient = require('@/lib/supabase/server').createClient
      require('@/lib/supabase/server').createClient = jest.fn(() => mockSupabase)

      const deviceInfo: DeviceInfo = {
        fingerprint: 'test-fingerprint',
        name: 'Chrome on Windows',
        type: 'desktop',
        browser: {
          name: 'Chrome',
          version: '120.0'
        },
        os: {
          name: 'Windows',
          version: '10'
        }
      }

      const locationInfo: LocationInfo = {
        ip: '192.168.1.100',
        country: 'US',
        city: 'New York'
      }

      const result = await sessionService.createSession(
        'user-123',
        'tenant-123',
        deviceInfo,
        locationInfo
      )

      expect(result.success).toBe(true)
      expect(result.session?.id).toBe('new-session-id')
      expect(result.session?.device_name).toBe('Chrome on Windows')

      require('@/lib/supabase/server').createClient = originalCreateClient
    })
  })

  describe('updateSessionActivity', () => {
    it('should update session last activity', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  data: null,
                  error: null
                }))
              }))
            }))
          }))
        }))
      }

      const originalCreateClient = require('@/lib/supabase/server').createClient
      require('@/lib/supabase/server').createClient = jest.fn(() => mockSupabase)

      const result = await sessionService.updateSessionActivity(
        'session-1',
        'user-123',
        'tenant-123'
      )

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('user_sessions')

      require('@/lib/supabase/server').createClient = originalCreateClient
    })
  })

  describe('getSessionById', () => {
    it('should get session by ID', async () => {
      const mockSession = {
        id: 'session-1',
        user_id: 'user-123',
        tenant_id: 'tenant-123',
        device_name: 'Chrome on Windows',
        ip_address: '192.168.1.100',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-01T01:00:00Z'
      }

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: mockSession,
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      }

      const originalCreateClient = require('@/lib/supabase/server').createClient
      require('@/lib/supabase/server').createClient = jest.fn(() => mockSupabase)

      const result = await sessionService.getSessionById(
        'session-1',
        'user-123',
        'tenant-123'
      )

      expect(result).toEqual(mockSession)

      require('@/lib/supabase/server').createClient = originalCreateClient
    })

    it('should handle session not found', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: null,
                    error: { message: 'Not found' }
                  }))
                }))
              }))
            }))
          }))
        }))
      }

      const originalCreateClient = require('@/lib/supabase/server').createClient
      require('@/lib/supabase/server').createClient = jest.fn(() => mockSupabase)

      const result = await sessionService.getSessionById(
        'nonexistent',
        'user-123',
        'tenant-123'
      )

      expect(result).toBeNull()

      require('@/lib/supabase/server').createClient = originalCreateClient
    })
  })

  describe('device detection', () => {
    it('should detect Chrome browser correctly', () => {
      const deviceInfo = sessionService.parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
      
      expect(deviceInfo).toContain('Chrome')
      expect(deviceInfo).toContain('Windows')
    })

    it('should detect Safari browser correctly', () => {
      const deviceInfo = sessionService.parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1')
      
      expect(deviceInfo).toContain('Safari')
      expect(deviceInfo).toContain('iPhone')
    })

    it('should handle unknown user agent', () => {
      const deviceInfo = sessionService.parseUserAgent('Unknown Browser/1.0')
      
      expect(deviceInfo).toBe('Unknown Device')
    })
  })

  describe('session validation', () => {
    it('should validate session expiry', () => {
      const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      const isExpired = sessionService.isSessionExpired(expiredDate.toISOString())
      
      expect(isExpired).toBe(true)
    })

    it('should validate active session', () => {
      const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      const isExpired = sessionService.isSessionExpired(recentDate.toISOString())
      
      expect(isExpired).toBe(false)
    })
  })
})