/**
 * Enterprise Testing Setup for AssetTrackerPro
 * Configures enterprise-grade testing environment with compliance and security features
 */

import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Global Test Environment Setup
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Enterprise Environment Variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.ENTERPRISE_MODE = 'true'
process.env.COMPLIANCE_MODE = 'strict'
process.env.AUDIT_LOGGING = 'enabled'

// Mock Service Worker for API Testing
const server = setupServer(
  // Default handlers for common API endpoints
  rest.get('/api/health', (req, res, ctx) => {
    return res(ctx.json({ status: 'ok', timestamp: new Date().toISOString() }))
  }),
  
  rest.get('/api/auth/user', (req, res, ctx) => {
    return res(ctx.json({ 
      user: { 
        id: 'test-user-id', 
        email: 'test@enterprise.com',
        role: 'admin',
        tenant_id: 'test-tenant-id'
      } 
    }))
  })
)

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})

// Global Test Utilities
global.testUtils = {
  // Enterprise Test Data Factory
  createTestUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@enterprise.com',
    full_name: 'Test User',
    role: 'user',
    tenant_id: 'test-tenant-id',
    created_at: new Date().toISOString(),
    ...overrides
  }),

  createTestAsset: (overrides = {}) => ({
    id: 'test-asset-id',
    asset_id: 'TEST-001',
    name: 'Test Asset',
    category: 'test-category',
    status: 'active',
    tenant_id: 'test-tenant-id',
    created_by: 'test-user-id',
    created_at: new Date().toISOString(),
    ...overrides
  }),

  createTestTenant: (overrides = {}) => ({
    id: 'test-tenant-id',
    name: 'Test Enterprise',
    domain: 'test-enterprise.com',
    plan: 'enterprise',
    settings: {
      compliance_mode: 'strict',
      audit_retention_days: 2555, // 7 years
      data_residency: 'US'
    },
    ...overrides
  }),

  // Compliance Test Helpers
  validateAuditLog: (action, entity, userId) => {
    expect(action).toBeDefined()
    expect(entity).toBeDefined()
    expect(userId).toBeDefined()
    expect(action.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(action.user_id).toBe(userId)
  },

  validateDataRetention: (data, retentionDays = 2555) => {
    const createdAt = new Date(data.created_at)
    const retentionDate = new Date()
    retentionDate.setDate(retentionDate.getDate() - retentionDays)
    
    if (createdAt < retentionDate) {
      throw new Error(`Data retention policy violated: ${data.id}`)
    }
  },

  // Security Test Helpers
  validateTenantIsolation: (data, expectedTenantId) => {
    expect(data.tenant_id).toBe(expectedTenantId)
  },

  validatePermissions: (userPermissions, requiredPermission) => {
    expect(userPermissions).toContain(requiredPermission)
  },

  // Performance Test Helpers
  measureExecutionTime: async (fn) => {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    return { result, executionTime: end - start }
  }
}

// Mock Enterprise Services
jest.mock('@/lib/services/audit-service', () => ({
  logAuditEvent: jest.fn().mockResolvedValue({ success: true }),
  getAuditTrail: jest.fn().mockResolvedValue([]),
  validateAuditIntegrity: jest.fn().mockResolvedValue(true)
}))

jest.mock('@/lib/services/compliance-service', () => ({
  validateDataRetention: jest.fn().mockResolvedValue(true),
  generateComplianceReport: jest.fn().mockResolvedValue({}),
  checkGDPRCompliance: jest.fn().mockResolvedValue(true),
  checkSOC2Compliance: jest.fn().mockResolvedValue(true)
}))

jest.mock('@/lib/services/security-service', () => ({
  validateTenantAccess: jest.fn().mockResolvedValue(true),
  checkPermissions: jest.fn().mockResolvedValue(true),
  logSecurityEvent: jest.fn().mockResolvedValue({ success: true }),
  detectAnomalies: jest.fn().mockResolvedValue([])
}))

// Mock Supabase with Enterprise Features
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: global.testUtils.createTestUser() },
        error: null
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: global.testUtils.createTestUser() } },
        error: null
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: global.testUtils.createTestUser() },
        error: null
      }),
      signOut: jest.fn().mockResolvedValue({ error: null })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        download: jest.fn().mockResolvedValue({ data: null, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        list: jest.fn().mockResolvedValue({ data: [], error: null })
      }))
    }
  }))
}))

// Mock Next.js with Enterprise Features
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    }
  }))
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn()
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
  useParams: jest.fn(() => ({}))
}))

// Console override for test environment
const originalConsole = global.console
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}

// Cleanup function
global.afterEach(() => {
  jest.clearAllMocks()
})

export { server }
