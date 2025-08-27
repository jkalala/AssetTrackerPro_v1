/**
 * GraphQL Context Setup
 * Provides tenant-scoped services and authentication context
 */

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { AssetService } from '../services/asset-service'
import { UserService } from '../services/user-service'
import { IntegrationService } from '../services/integration-service'
import { WebhookService } from '../services/webhook-service'
import { AnalyticsService } from '../services/analytics-service'
import { SearchService } from '../services/search-service'
import { TenantService } from '../services/tenant-service'
import { PermissionService } from '../services/permission-service'

export interface Context {
  supabase: ReturnType<typeof createServerClient>
  assetService: AssetService
  userService: UserService
  integrationService: IntegrationService
  webhookService: WebhookService
  analyticsService: AnalyticsService
  searchService: SearchService
  tenantService: TenantService
  permissionService: PermissionService
  req: NextRequest
}

export interface AuthenticatedContext extends Context {
  user: {
    id: string
    email: string
    tenantId: string
    role: string
    permissions: string[]
  }
}

export async function createContext(req: NextRequest): Promise<Context> {
  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set() {
          // Not needed for server-side operations
        },
        remove() {
          // Not needed for server-side operations
        },
      },
    }
  )

  // Initialize services
  const assetService = new AssetService(supabase)
  const userService = new UserService(supabase)
  const integrationService = new IntegrationService(supabase)
  const webhookService = new WebhookService(supabase)
  const analyticsService = new AnalyticsService(supabase)
  const searchService = new SearchService(supabase)
  const tenantService = new TenantService()
  const permissionService = new PermissionService()

  return {
    supabase,
    assetService,
    userService,
    integrationService,
    webhookService,
    analyticsService,
    searchService,
    tenantService,
    permissionService,
    req,
  }
}

export async function authenticateContext(context: Context): Promise<AuthenticatedContext> {
  const { supabase, req } = context

  // Get authorization header
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.substring(7)

  // Verify JWT token
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    throw new Error('Invalid or expired token')
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
    throw new Error('User profile not found')
  }

  // Extract permissions
  const permissions = profile.permissions?.map((p: Record<string, unknown>) => (p.permission as any)?.name) || []

  return {
    ...context,
    user: {
      id: profile.id,
      email: profile.email,
      tenantId: profile.tenant_id,
      role: profile.role,
      permissions,
    },
  }
}

export function requirePermission(permission: string) {
  return (context: AuthenticatedContext) => {
    if (!context.user.permissions.includes(permission) && context.user.role !== 'SUPER_ADMIN') {
      throw new Error(`Insufficient permissions. Required: ${permission}`)
    }
  }
}

export function requireRole(role: string) {
  return (context: AuthenticatedContext) => {
    if (context.user.role !== role && context.user.role !== 'SUPER_ADMIN') {
      throw new Error(`Insufficient role. Required: ${role}`)
    }
  }
}

export function requireTenantAccess(tenantId: string) {
  return (context: AuthenticatedContext) => {
    if (context.user.tenantId !== tenantId && context.user.role !== 'SUPER_ADMIN') {
      throw new Error('Access denied to tenant resources')
    }
  }
}