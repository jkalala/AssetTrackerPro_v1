import "@testing-library/jest-dom"

// Ensure jest is available globally
if (typeof jest === 'undefined') {
  global.jest = require('@jest/globals').jest
}

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(() => Promise.resolve()),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return "/"
  },
}))

// Mock Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

// Mock Next.js server APIs
jest.mock("next/server", () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => ({
    url: url || "http://localhost:3000",
    method: options?.method || "GET",
    headers: new Map(Object.entries(options?.headers || {})),
    ...options,
  })),
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}))

// Mock Next.js cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomBytes: jest.fn((size) => Buffer.alloc(size, 'mock')),
    createHash: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'mocked-hash'),
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
    randomUUID: jest.fn(() => 'mock-uuid'),
  },
})
