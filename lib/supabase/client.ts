import { getSupabaseClientSingleton } from "./singleton"

// Create a mock client for server-side rendering
const createMockClient = () => ({
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithOAuth: () => Promise.resolve({ data: null, error: new Error("Mock client - no auth operations") }),
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error("Mock client - no auth operations") }),
    signUp: () => Promise.resolve({ data: null, error: new Error("Mock client - no auth operations") }),
    signOut: () => Promise.resolve({ error: null }),
    updateUser: () => Promise.resolve({ data: null, error: new Error("Mock client - no auth operations") }),
    setSession: () => Promise.resolve({ data: null, error: new Error("Mock client - no auth operations") }),
    resetPasswordForEmail: () => Promise.resolve({ data: null, error: new Error("Mock client - no auth operations") }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
      error: null,
    }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () =>
          Promise.resolve({
            data: null,
            error: { code: "MOCK_CLIENT", message: "Mock client - no database operations" },
          }),
      }),
      order: () => Promise.resolve({ data: [], error: null }),
      limit: () => Promise.resolve({ data: [], error: null }),
    }),
    insert: () => Promise.resolve({ data: null, error: { message: "Mock client - no database operations" } }),
    update: () => Promise.resolve({ data: null, error: { message: "Mock client - no database operations" } }),
    delete: () => Promise.resolve({ data: null, error: { message: "Mock client - no database operations" } }),
  }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: { message: "Mock client - no storage operations" } }),
      download: () => Promise.resolve({ data: null, error: { message: "Mock client - no storage operations" } }),
      remove: () => Promise.resolve({ data: null, error: { message: "Mock client - no storage operations" } }),
    }),
  },
})

export function createClient() {
  // Check if we're in a server environment (build time or SSR)
  if (typeof window === "undefined") {
    console.log("Server environment detected, using mock client")
    return createMockClient() as any
  }

  try {
    // Use the singleton pattern to ensure consistent client usage
    const client = getSupabaseClientSingleton()
    console.log("Supabase client created successfully")
    return client
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    console.log("Falling back to mock client")
    return createMockClient() as any
  }
}

// Health check function
export const checkSupabaseConnection = async () => {
  try {
    const client = createClient()
    const { data, error } = await client.auth.getSession()

    if (error) {
      console.error("Supabase connection error:", error)
      return { connected: false, error: error.message }
    }

    console.log("Supabase connection successful")
    return { connected: true, session: data.session }
  } catch (error) {
    console.error("Supabase health check failed:", error)
    return { connected: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
