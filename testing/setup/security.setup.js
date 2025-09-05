/**
 * Security Testing Setup for AssetTrackerPro
 * Configures security-focused testing environment for enterprise applications
 */

// Security Test Environment Configuration
process.env.SECURITY_TEST_MODE = 'true'
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters'
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only'

// Security Test Utilities
global.securityTestUtils = {
  // Authentication Testing
  createValidJWT: (payload = {}) => {
    const defaultPayload = {
      sub: 'test-user-id',
      email: 'test@enterprise.com',
      role: 'user',
      tenant_id: 'test-tenant-id',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    }
    return Buffer.from(JSON.stringify({ ...defaultPayload, ...payload })).toString('base64')
  },

  createExpiredJWT: () => {
    const payload = {
      sub: 'test-user-id',
      email: 'test@enterprise.com',
      iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
    }
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  },

  createMaliciousJWT: () => {
    const payload = {
      sub: 'malicious-user',
      email: 'hacker@evil.com',
      role: 'admin', // Privilege escalation attempt
      tenant_id: 'different-tenant-id', // Tenant isolation bypass attempt
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  },

  // Authorization Testing
  createUserWithPermissions: (permissions = []) => ({
    id: 'test-user-id',
    email: 'test@enterprise.com',
    role: 'user',
    tenant_id: 'test-tenant-id',
    permissions: permissions,
  }),

  createAdminUser: () => ({
    id: 'admin-user-id',
    email: 'admin@enterprise.com',
    role: 'admin',
    tenant_id: 'test-tenant-id',
    permissions: ['*'], // All permissions
  }),

  // Input Validation Testing
  sqlInjectionPayloads: [
    "'; DROP TABLE assets; --",
    "' OR '1'='1",
    "'; UPDATE users SET role='admin' WHERE id='1'; --",
    "' UNION SELECT * FROM users --",
    "'; INSERT INTO users (email, role) VALUES ('hacker@evil.com', 'admin'); --",
  ],

  xssPayloads: [
    "<script>alert('XSS')</script>",
    "javascript:alert('XSS')",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "';alert('XSS');//",
  ],

  pathTraversalPayloads: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '....//....//....//etc/passwd',
  ],

  // Data Validation Testing
  validateSanitizedInput: (input, sanitized) => {
    // Check for common XSS patterns
    expect(sanitized).not.toMatch(/<script/i)
    expect(sanitized).not.toMatch(/javascript:/i)
    expect(sanitized).not.toMatch(/on\w+=/i)

    // Check for SQL injection patterns
    expect(sanitized).not.toMatch(/['";]/g)
    expect(sanitized).not.toMatch(/\b(DROP|DELETE|UPDATE|INSERT|SELECT)\b/i)

    // Check for path traversal
    expect(sanitized).not.toMatch(/\.\./g)
  },

  // Encryption Testing
  validateEncryption: (plaintext, encrypted) => {
    expect(encrypted).toBeDefined()
    expect(encrypted).not.toBe(plaintext)
    expect(encrypted.length).toBeGreaterThan(0)
    expect(typeof encrypted).toBe('string')
  },

  validatePasswordHash: (password, hash) => {
    expect(hash).toBeDefined()
    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(password.length)
    // Should contain salt and hash
    expect(hash).toMatch(/\$/)
  },

  // Session Security Testing
  validateSessionSecurity: sessionData => {
    expect(sessionData.httpOnly).toBe(true)
    expect(sessionData.secure).toBe(true)
    expect(sessionData.sameSite).toBe('strict')
    expect(sessionData.maxAge).toBeLessThanOrEqual(3600) // 1 hour max
  },

  // Rate Limiting Testing
  simulateRateLimitAttack: async (endpoint, requests = 100) => {
    const promises = Array(requests)
      .fill()
      .map(() => fetch(endpoint, { method: 'POST' }))
    return Promise.allSettled(promises)
  },

  // CSRF Testing
  validateCSRFProtection: response => {
    expect(response.headers).toHaveProperty('x-csrf-token')
    expect(response.headers['x-csrf-token']).toBeTruthy()
  },

  // Tenant Isolation Testing
  validateTenantIsolation: (data, expectedTenantId) => {
    if (Array.isArray(data)) {
      data.forEach(item => {
        expect(item.tenant_id).toBe(expectedTenantId)
      })
    } else {
      expect(data.tenant_id).toBe(expectedTenantId)
    }
  },

  // Security Headers Testing
  validateSecurityHeaders: response => {
    const headers = response.headers

    // Content Security Policy
    expect(headers).toHaveProperty('content-security-policy')

    // X-Frame-Options
    expect(headers).toHaveProperty('x-frame-options')
    expect(headers['x-frame-options']).toBe('DENY')

    // X-Content-Type-Options
    expect(headers).toHaveProperty('x-content-type-options')
    expect(headers['x-content-type-options']).toBe('nosniff')

    // Strict-Transport-Security
    expect(headers).toHaveProperty('strict-transport-security')

    // X-XSS-Protection
    expect(headers).toHaveProperty('x-xss-protection')
    expect(headers['x-xss-protection']).toBe('1; mode=block')
  },
}

// Mock Security Services
jest.mock('@/lib/services/encryption-service', () => ({
  encrypt: jest.fn(data => `encrypted_${data}`),
  decrypt: jest.fn(data => data.replace('encrypted_', '')),
  hash: jest.fn(data => `hashed_${data}`),
  compareHash: jest.fn((data, hash) => hash === `hashed_${data}`),
}))

jest.mock('@/lib/services/rate-limit-service', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 99 }),
  incrementCounter: jest.fn().mockResolvedValue(1),
  resetCounter: jest.fn().mockResolvedValue(true),
}))

jest.mock('@/lib/middleware/security-headers', () => ({
  addSecurityHeaders: jest.fn(response => {
    response.headers = {
      ...response.headers,
      'content-security-policy': "default-src 'self'",
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'x-xss-protection': '1; mode=block',
    }
    return response
  }),
}))

// Mock Crypto for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomBytes: jest.fn(size => Buffer.alloc(size, 'test')),
    createHash: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'test-hash'),
    })),
    createCipheriv: jest.fn(() => ({
      update: jest.fn(() => 'encrypted'),
      final: jest.fn(() => 'final'),
    })),
    createDecipheriv: jest.fn(() => ({
      update: jest.fn(() => 'decrypted'),
      final: jest.fn(() => 'final'),
    })),
    scryptSync: jest.fn(() => Buffer.alloc(32, 'key')),
    randomUUID: jest.fn(() => 'test-uuid'),
    timingSafeEqual: jest.fn(() => true),
  },
})

// Security Test Matchers
expect.extend({
  toBeSecurelyHashed(received) {
    const pass =
      received && typeof received === 'string' && received.length > 20 && received.includes('$')

    return {
      message: () => `expected ${received} to be a securely hashed value`,
      pass,
    }
  },

  toBeValidJWT(received) {
    try {
      const parts = received.split('.')
      const pass = parts.length === 3

      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass,
      }
    } catch {
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: false,
      }
    }
  },

  toHaveSecurityHeaders(received) {
    const requiredHeaders = [
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security',
    ]

    const hasAllHeaders = requiredHeaders.every(
      header => received.headers && received.headers[header]
    )

    return {
      message: () => `expected response to have all required security headers`,
      pass: hasAllHeaders,
    }
  },
})

export default global.securityTestUtils
