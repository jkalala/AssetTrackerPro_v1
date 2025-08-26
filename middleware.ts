import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { tenantService } from '@/lib/services/tenant-service'
// import { rlsManager } from '@/lib/security/rls-utils' // Unused import

// =====================================================
// ROUTE CONFIGURATION
// =====================================================

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/auth',
  '/privacy',
  '/terms',
  '/docs',
  '/features',
  '/pricing',
  '/contact',
  '/api/webhooks',
  '/api/health'
]

// Admin-only routes requiring elevated permissions
const ADMIN_ROUTES = [
  '/admin',
  '/settings/billing',
  '/settings/users',
  '/settings/roles',
  '/settings/tenant',
  '/settings/security',
  '/settings/integrations',
  '/settings/compliance'
]

// Manager-level routes
const MANAGER_ROUTES = [
  '/analytics',
  '/reports',
  '/maintenance',
  '/geofences',
  '/iot-devices'
]

// API routes that require tenant context
const TENANT_API_ROUTES = [
  '/api/assets',
  '/api/analytics',
  '/api/maintenance',
  '/api/iot',
  '/api/geofence',
  '/api/audit',
  '/api/reports',
  '/api/users',
  '/api/categories',
  '/api/uploads'
]

// Rate limiting configuration per route type
const RATE_LIMITS = {
  api: { requests: 100, window: 60000 }, // 100 requests per minute
  auth: { requests: 10, window: 60000 }, // 10 auth attempts per minute
  upload: { requests: 20, window: 60000 }, // 20 uploads per minute
  export: { requests: 5, window: 300000 } // 5 exports per 5 minutes
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const startTime = Date.now()
  
  // Skip middleware for static files and certain paths
  if (shouldSkipMiddleware(req.nextUrl.pathname)) {
    return res
  }

  try {
    // Create Supabase client
    const supabase = createMiddlewareClient({ req, res })

    // Add request ID for tracing
    const requestId = generateRequestId()
    res.headers.set('x-request-id', requestId)

    // Get session with error handling
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) {
      await logSecurityEvent('session_error', { error: sessionError.message }, req)
      return redirectToLogin(req)
    }

    // Handle public routes
    if (isPublicRoute(req.nextUrl.pathname)) {
      return addSecurityHeaders(res)
    }

    // Require authentication for protected routes
    if (!session) {
      await logSecurityEvent('unauthenticated_access', { path: req.nextUrl.pathname }, req)
      return redirectToLogin(req)
    }

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(req, session.user.id)
    if (!rateLimitResult.allowed) {
      await logSecurityEvent('rate_limit_exceeded', rateLimitResult, req)
      const retryAfter = Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)
      return createRateLimitResponse(retryAfter, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.resetTime)
    }

    // Get user profile with enhanced error handling
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        tenant_id, 
        role, 
        is_owner, 
        email, 
        permissions,
        department,
        mfa_enabled,
        locked_until,
        failed_login_attempts
      `)
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      await logSecurityEvent('profile_not_found', { userId: session.user.id }, req)
      return redirectToProfileSetup(req)
    }

    // Check if user account is locked
    if (profile.locked_until && new Date(profile.locked_until) > new Date()) {
      await logSecurityEvent('locked_account_access', { userId: session.user.id }, req)
      return redirectToError(req, 'Account temporarily locked')
    }

    // Check if user has a tenant
    if (!profile.tenant_id) {
      return redirectToTenantSetup(req)
    }

    // Get tenant information with caching
    const { data: tenant, error: tenantError } = await tenantService.getTenant(profile.tenant_id)

    if (tenantError || !tenant) {
      await logSecurityEvent('tenant_not_found', { tenantId: profile.tenant_id }, req)
      return redirectToError(req, 'Organization not found')
    }

    // Enhanced tenant status checks
    const tenantStatusCheck = await validateTenantStatus(tenant, req)
    if (tenantStatusCheck.redirect) {
      return tenantStatusCheck.redirect
    }

    // Role-based route access control
    const accessCheck = await validateRouteAccess(req.nextUrl.pathname, profile.role, profile.permissions)
    if (!accessCheck.allowed) {
      await logSecurityEvent('unauthorized_route_access', {
        path: req.nextUrl.pathname,
        role: profile.role,
        reason: accessCheck.reason
      }, req)
      return redirectToUnauthorized(req)
    }

    // Set comprehensive tenant context headers
    const contextHeaders = createTenantContextHeaders(profile, tenant, session, requestId)
    Object.entries(contextHeaders).forEach(([key, value]) => {
      res.headers.set(key, value)
    })

    // Handle API routes with enhanced tenant context
    if (isTenantApiRoute(req.nextUrl.pathname)) {
      try {
        await tenantService.setTenantContext(session.user.id, profile.tenant_id)
        
        // Set additional API-specific headers
        res.headers.set('x-api-version', '1.0')
        res.headers.set('x-tenant-plan', tenant.plan)
        res.headers.set('x-rate-limit-remaining', rateLimitResult.remaining.toString())
        res.headers.set('x-rate-limit-reset', rateLimitResult.resetTime.toISOString())
        
      } catch (error) {
        console.error('Error setting tenant context:', error)
        await logSecurityEvent('context_setup_error', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, req)
      }
    }

    // Add comprehensive security headers
    addSecurityHeaders(res)

    // Log successful request processing
    const processingTime = Date.now() - startTime
    if (processingTime > 1000) { // Log slow requests
      console.warn(`Slow middleware processing: ${processingTime}ms for ${req.nextUrl.pathname}`)
    }

    return res

  } catch (error) {
    console.error('Middleware error:', error)
    await logSecurityEvent('middleware_error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    }, req)
    return redirectToError(req, 'System error')
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function shouldSkipMiddleware(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/webhooks/') ||
    pathname.startsWith('/api/health')
  )
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => 
    pathname.startsWith(route)
  )
}

function isManagerRoute(pathname: string): boolean {
  return MANAGER_ROUTES.some(route => 
    pathname.startsWith(route)
  )
}

function isTenantApiRoute(pathname: string): boolean {
  return TENANT_API_ROUTES.some(route => 
    pathname.startsWith(route)
  )
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

async function checkRateLimit(req: NextRequest, userId: string): Promise<{
  allowed: boolean
  remaining: number
  resetTime: Date
  limit: number
}> {
  // Import rate limiting functionality
  const { withRateLimit } = await import('./lib/with-rate-limit')
  
  // Determine rate limit based on route type
  let rateLimitOptions = { limit: 100, window: "1m" } // Default API limit
  
  if (req.nextUrl.pathname.startsWith('/api/auth/')) {
    rateLimitOptions = { limit: 10, window: "1m" }
  } else if (req.nextUrl.pathname.includes('/upload')) {
    rateLimitOptions = { limit: 20, window: "1m" }
  } else if (req.nextUrl.pathname.includes('/export')) {
    rateLimitOptions = { limit: 5, window: "5m" }
  }

  // Use user ID as identifier for authenticated requests
  const rateLimitOptions2 = { ...rateLimitOptions, identifier: userId }
  
  try {
    const rateLimitResponse = await withRateLimit(req, rateLimitOptions2)
    
    if (rateLimitResponse) {
      // Rate limit exceeded
      const retryAfter = rateLimitResponse.headers.get('Retry-After')
      const limit = rateLimitResponse.headers.get('X-RateLimit-Limit')
      const remaining = rateLimitResponse.headers.get('X-RateLimit-Remaining')
      const reset = rateLimitResponse.headers.get('X-RateLimit-Reset')
      
      return {
        allowed: false,
        remaining: parseInt(remaining || '0'),
        resetTime: new Date(parseInt(reset || '0')),
        limit: parseInt(limit || '60')
      }
    }
    
    // Rate limit passed
    return {
      allowed: true,
      remaining: rateLimitOptions.limit - 1,
      resetTime: new Date(Date.now() + (rateLimitOptions.window === "1m" ? 60000 : 300000)),
      limit: rateLimitOptions.limit
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // Allow request on error to avoid blocking legitimate traffic
    return {
      allowed: true,
      remaining: rateLimitOptions.limit - 1,
      resetTime: new Date(Date.now() + 60000),
      limit: rateLimitOptions.limit
    }
  }
}

async function validateTenantStatus(tenant: any, req: NextRequest): Promise<{
  redirect?: NextResponse
}> {
  switch (tenant.status) {
    case 'suspended':
      await logSecurityEvent('suspended_tenant_access', { tenantId: tenant.id }, req)
      return { redirect: redirectToSuspended(req) }
    
    case 'cancelled':
      await logSecurityEvent('cancelled_tenant_access', { tenantId: tenant.id }, req)
      return { redirect: redirectToError(req, 'Account cancelled') }
    
    case 'trial':
      // Check if trial has expired
      if (tenant.trial_ends_at && new Date(tenant.trial_ends_at) < new Date()) {
        return { redirect: redirectToError(req, 'Trial expired') }
      }
      break
  }

  return {}
}

async function validateRouteAccess(pathname: string, role: string, permissions: any): Promise<{
  allowed: boolean
  reason?: string
}> {
  // Admin routes require admin or owner role
  if (isAdminRoute(pathname)) {
    if (!['owner', 'admin'].includes(role)) {
      return { allowed: false, reason: 'Insufficient role for admin route' }
    }
  }

  // Manager routes require manager, admin, or owner role
  if (isManagerRoute(pathname)) {
    if (!['owner', 'admin', 'manager'].includes(role)) {
      return { allowed: false, reason: 'Insufficient role for manager route' }
    }
  }

  // Check specific permissions for API routes
  if (pathname.startsWith('/api/')) {
    return validateApiAccess(pathname, role, permissions)
  }

  return { allowed: true }
}

async function validateApiAccess(pathname: string, role: string, _permissions: any): Promise<{
  allowed: boolean
  reason?: string
}> {
  // Define API permission matrix
  const apiPermissions = {
    '/api/assets': ['owner', 'admin', 'manager', 'user'],
    '/api/users': ['owner', 'admin'],
    '/api/analytics': ['owner', 'admin', 'manager'],
    '/api/audit': ['owner', 'admin'],
    '/api/integrations': ['owner', 'admin'],
    '/api/billing': ['owner'],
    '/api/tenant': ['owner']
  }

  // Find matching API route
  const matchingRoute = Object.keys(apiPermissions).find(route => 
    pathname.startsWith(route)
  )

  if (matchingRoute) {
    const allowedRoles = apiPermissions[matchingRoute as keyof typeof apiPermissions]
    if (!allowedRoles.includes(role)) {
      return { allowed: false, reason: `Role ${role} not allowed for ${matchingRoute}` }
    }
  }

  // Viewers can only read, not write
  if (role === 'viewer') {
    const method = pathname.includes('POST') || pathname.includes('PUT') || pathname.includes('DELETE')
    if (method) {
      return { allowed: false, reason: 'Viewers cannot perform write operations' }
    }
  }

  return { allowed: true }
}

function createTenantContextHeaders(profile: any, tenant: any, session: any, requestId: string): Record<string, string> {
  return {
    // Core tenant context
    'x-tenant-id': profile.tenant_id,
    'x-user-id': session.user.id,
    'x-user-role': profile.role,
    'x-user-email': profile.email,
    'x-is-owner': profile.is_owner.toString(),
    
    // Tenant information
    'x-tenant-status': tenant.status,
    'x-tenant-plan': tenant.plan,
    'x-tenant-slug': tenant.slug,
    
    // Security context
    'x-mfa-enabled': profile.mfa_enabled.toString(),
    'x-department': profile.department || '',
    
    // Request tracking
    'x-request-id': requestId,
    'x-request-timestamp': new Date().toISOString(),
    
    // Feature flags (basic)
    'x-features-enabled': JSON.stringify(tenant.feature_flags || {})
  }
}

function addSecurityHeaders(res: NextResponse): NextResponse {
  // Security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // Content Security Policy
  res.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
  )
  
  // Permissions Policy
  res.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(self), payment=()'
  )

  return res
}

async function logSecurityEvent(event: string, details: any, req: NextRequest): Promise<void> {
  try {
    // In production, this would log to your security monitoring system
    console.warn(`Security Event: ${event}`, {
      ...details,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent'),
      path: req.nextUrl.pathname,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging security event:', error)
  }
}

function createRateLimitResponse(retryAfter?: number, limit?: number, remaining?: number, reset?: Date): NextResponse {
  const retryAfterSeconds = retryAfter || 60
  return new NextResponse(
    JSON.stringify({ 
      error: 'Rate limit exceeded',
      message: `Too many requests. Try again in ${retryAfterSeconds} seconds.`,
      retryAfter: retryAfterSeconds,
      limit: limit || 60,
      remaining: remaining || 0,
      reset: reset?.getTime() || Date.now() + 60000
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfterSeconds.toString(),
        'X-RateLimit-Limit': (limit || 60).toString(),
        'X-RateLimit-Remaining': (remaining || 0).toString(),
        'X-RateLimit-Reset': (reset?.getTime() || Date.now() + 60000).toString()
      }
    }
  )
}

function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('redirect', req.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

function redirectToProfileSetup(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/profile-setup', req.url))
}

function redirectToTenantSetup(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/tenant-setup', req.url))
}

function redirectToSuspended(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/account-suspended', req.url))
}

function redirectToUnauthorized(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/unauthorized', req.url))
}

function redirectToError(req: NextRequest, message: string): NextResponse {
  const errorUrl = new URL('/error', req.url)
  errorUrl.searchParams.set('message', message)
  return NextResponse.redirect(errorUrl)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    '/api/:path*',
  ],
}
