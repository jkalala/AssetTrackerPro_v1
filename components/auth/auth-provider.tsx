'use client'

import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { DEFAULT_ROLE_PERMISSIONS, Role, Permission } from '@/lib/rbac/types'
import { createClient } from '@/lib/supabase/client'

type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  retry: () => void
  role: Role | null
  permissions: Permission[]
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
  retry: () => {},
  role: null,
  permissions: [],
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const usePermissions = () => {
  const { permissions, role } = useAuth()
  const hasPermission = (perm: Permission) => permissions.includes(perm)
  const hasAnyPermission = (perms: Permission[]) => perms.some(p => permissions.includes(p))
  return { permissions, role, hasPermission, hasAnyPermission }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [role, setRole] = useState<Role | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const retry = () => {
    setRetryCount(prev => prev + 1)
    setError(null)
    setLoading(true)
  }

  useEffect(() => {
    if (!mounted) return

    let isMounted = true

    const initializeAuth = async () => {
      try {
        setError(null)

        // Dynamic import to prevent SSR issues
        const { createClient, checkSupabaseConnection } = await import('@/lib/supabase/client')

        // First check if Supabase is properly configured
        const healthCheck = await checkSupabaseConnection()
        if (!healthCheck.connected) {
          throw new Error(`Supabase connection failed: ${healthCheck.error}`)
        }

        const supabase = createClient()

        // Get initial session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          throw new Error(`Authentication error: ${sessionError.message}`)
        }

        if (isMounted) {
          setUser(session?.user ?? null)
          setLoading(false)
          setError(null)
        }

        // Fetch user profile for role/permissions
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          if (!profileError && profile?.role) {
            setRole(profile.role as Role)
            setPermissions(DEFAULT_ROLE_PERMISSIONS[profile.role as Role] || [])
          } else {
            setRole(null)
            setPermissions([])
          }
        } else {
          setRole(null)
          setPermissions([])
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
          console.log('Auth state changed:', event, session?.user?.id)
          if (isMounted) {
            setUser(session?.user ?? null)
            setLoading(false)
            setError(null)
          }
          // Refetch profile/permissions on auth change
          if (session?.user) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single()
            if (!profileError && profile?.role) {
              setRole(profile.role as Role)
              setPermissions(DEFAULT_ROLE_PERMISSIONS[profile.role as Role] || [])
            } else {
              setRole(null)
              setPermissions([])
            }
          } else {
            setRole(null)
            setPermissions([])
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Authentication initialization failed')
          setLoading(false)
        }
      }
    }

    const cleanup = initializeAuth()

    return () => {
      isMounted = false
      cleanup?.then(unsubscribe => unsubscribe?.())
    }
  }, [mounted, retryCount])

  const signOut = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign out error:', error)
        setError(`Sign out failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Sign out error:', error)
      setError('Sign out failed')
    }
  }

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing AssetTracker Pro...</p>
        </div>
      </div>
    )
  }

  // Show error state with retry option
  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={retry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut, retry, role, permissions }}>
      {children}
    </AuthContext.Provider>
  )
}
