import '@testing-library/jest-dom'

// Ensure jest is available globally
if (typeof jest === 'undefined') {
  global.jest = require('@jest/globals').jest
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
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
jest.mock('next/navigation', () => ({
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
    return '/'
  },
}))

// Mock Supabase with comprehensive chaining support
const createMockSupabaseQuery = () => {
  const mockData = { data: [], error: null }

  const createChainableMethod = (returnValue = mockData) => {
    const method = jest.fn(() => mockQuery)
    method.mockResolvedValue = jest.fn(() => {
      method.mockImplementation(() => Promise.resolve(returnValue))
      return method
    })
    return method
  }

  const mockQuery = {
    // Query methods that return this for chaining
    select: createChainableMethod(),
    insert: createChainableMethod(),
    update: createChainableMethod(),
    delete: createChainableMethod(),
    upsert: createChainableMethod(),
    eq: createChainableMethod(),
    neq: createChainableMethod(),
    gt: createChainableMethod(),
    gte: createChainableMethod(),
    lt: createChainableMethod(),
    lte: createChainableMethod(),
    like: createChainableMethod(),
    ilike: createChainableMethod(),
    is: createChainableMethod(),
    in: createChainableMethod(),
    contains: createChainableMethod(),
    containedBy: createChainableMethod(),
    rangeGt: createChainableMethod(),
    rangeGte: createChainableMethod(),
    rangeLt: createChainableMethod(),
    rangeLte: createChainableMethod(),
    rangeAdjacent: createChainableMethod(),
    overlaps: createChainableMethod(),
    textSearch: createChainableMethod(),
    match: createChainableMethod(),
    not: createChainableMethod(),
    or: createChainableMethod(),
    filter: createChainableMethod(),
    order: createChainableMethod(),
    limit: createChainableMethod(),
    range: createChainableMethod(),
    abortSignal: createChainableMethod(),
    returns: createChainableMethod(),

    // Terminal methods that return promises
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    csv: jest.fn().mockResolvedValue({ data: '', error: null }),
    geojson: jest.fn().mockResolvedValue({ data: null, error: null }),
    explain: jest.fn().mockResolvedValue({ data: null, error: null }),
    rollback: jest.fn().mockResolvedValue({ data: null, error: null }),
  }

  // Make the query object itself thenable for direct await
  mockQuery.then = jest.fn((resolve, reject) => {
    if (resolve) resolve(mockData)
    return Promise.resolve(mockData)
  })

  // Make the query object itself a promise
  Object.setPrototypeOf(mockQuery, Promise.prototype)

  return mockQuery
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOAuth: jest.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: null, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: null, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({ data: null, error: null }),
      updateUser: jest.fn().mockResolvedValue({ data: null, error: null }),
      setSession: jest.fn().mockResolvedValue({ data: null, error: null }),
      refreshSession: jest.fn().mockResolvedValue({ data: null, error: null }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => createMockSupabaseQuery()),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        download: jest.fn().mockResolvedValue({ data: null, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'mock-url' } })),
        createSignedUrl: jest.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrls: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
    realtime: {
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
        unsubscribe: jest.fn().mockReturnThis(),
      })),
      removeChannel: jest.fn(),
      removeAllChannels: jest.fn(),
      getChannels: jest.fn(() => []),
    },
  })),
}))

// Mock Next.js server APIs
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => ({
    url: url || 'http://localhost:3000',
    method: options?.method || 'GET',
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
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomBytes: jest.fn(size => Buffer.alloc(size, 'mock')),
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
