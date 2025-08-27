/**
 * Authentication Middleware
 * Handles authentication for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export interface AuthContext {
  user: {
    id: string
    email: string
    tenantId: string
    role: string
    permissions: string[]
  }
}

export function withAuth<T extends any[]>(
  handler: (req: NextRequest, context: AuthContext, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get authorization header
      const authHeader = req.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'Missing or invalid authorization header' },
          { status: 401 }
        )
      }

      const token = authHeader.substring(7)

      // Create Supabase client
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return req.cookies.get(name)?.value
            },
            set() {},
            remove() {},
          },
        }
      )

      // Verify JWT token
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        )
      }

      // Get user profile with tenant and permissions
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          tenant_id,
          role,
          permissions:user_permissions(
            permission:permissions(name)
          )
        `)
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { success: false, error: 'User profile not found' },
          { status: 401 }
        )
      }

      // Extract permissions
      const permissions = profile.permissions?.map((p: Record<string, unknown>) => (p.permission as any)?.name) || []

      const context: AuthContext = {
        user: {
          id: profile.id,
          email: profile.email,
          tenantId: profile.tenant_id,
          role: profile.role,
          permissions,
        },
      }

      return await handler(req, context, ...args)
    } catch (error) {
      console.error('Authentication error:', error)
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}