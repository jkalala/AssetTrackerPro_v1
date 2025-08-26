import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/security-events/route'
import { describe, it, expect } from '@jest/globals'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { role: 'admin' },
            error: null
          }))
        })),
        order: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [
              {
                id: 'event-1',
                event_type: 'login_success',
                severity: 'low',
                description: 'User logged in',
                created_at: new Date().toISOString()
              }
            ],
            error: null,
            count: 1
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          error: null
        }))
      }))
    }))
  }))
}))

// Mock the security event service
jest.mock('@/lib/services/security-event-service', () => ({
  securityEventService: {
    getSecurityEvents: jest.fn(() => Promise.resolve({
      events: [
        {
          id: 'event-1',
          event_type: 'login_success',
          severity: 'low',
          description: 'User logged in',
          created_at: new Date().toISOString()
        }
      ],
      total: 1
    })),
    resolveSecurityEvent: jest.fn(() => Promise.resolve(true))
  }
}))

describe('/api/admin/security-events', () => {
  describe('GET', () => {
    it('should return security events for admin users', async () => {
      const request = {
        nextUrl: { searchParams: new URLSearchParams() }
      } as NextRequest

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].event_type).toBe('login_success')
    })

    it('should filter events by event type', async () => {
      const request = {
        nextUrl: { searchParams: new URLSearchParams('eventType=login_success') }
      } as NextRequest

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('POST', () => {
    it('should resolve security events for admin users', async () => {
      const request = {
        json: jest.fn(() => Promise.resolve({
          eventId: 'event-1',
          action: 'resolve',
          notes: 'Resolved by admin'
        }))
      } as unknown as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Security event resolved')
    })

    it('should return error for invalid action', async () => {
      const request = {
        json: jest.fn(() => Promise.resolve({
          eventId: 'event-1',
          action: 'invalid'
        }))
      } as unknown as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })
  })
})