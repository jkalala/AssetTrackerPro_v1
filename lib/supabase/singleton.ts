import { createBrowserClient } from '@supabase/ssr'
import { ENV } from '@/lib/env'

// Global singleton instance
let supabaseClientSingleton: ReturnType<typeof createBrowserClient> | null = null

/**
 * Creates a singleton Supabase client to be used across the application
 * This ensures we don't create multiple instances which can cause issues
 */
export function getSupabaseClientSingleton() {
  // Only create in browser environment
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClientSingleton should only be called in browser environment')
  }

  // Return existing instance if available
  if (supabaseClientSingleton) {
    return supabaseClientSingleton
  }

  // Validate configuration
  if (!ENV.SUPABASE_URL || ENV.SUPABASE_URL === 'undefined') {
    throw new Error('SUPABASE_URL is required for client initialization')
  }

  if (!ENV.SUPABASE_ANON_KEY || ENV.SUPABASE_ANON_KEY === 'undefined') {
    throw new Error('SUPABASE_ANON_KEY is required for client initialization')
  }

  // Create new instance
  try {
    console.log('Creating singleton Supabase client with URL:', ENV.SUPABASE_URL)
    supabaseClientSingleton = createBrowserClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
    console.log('Singleton Supabase client created successfully')
    return supabaseClientSingleton
  } catch (error) {
    console.error('Error creating singleton Supabase client:', error)
    throw error
  }
}

/**
 * Resets the singleton instance - useful for testing or when auth state changes
 */
export function resetSupabaseClientSingleton() {
  supabaseClientSingleton = null
}
