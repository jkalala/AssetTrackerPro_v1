import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAuthorized } from '@/lib/rbac/utils'
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/auth',
  '/privacy',
  '/terms',
  '/docs',
  '/',
]

const ADMIN_ROUTES = [
  '/admin',
  '/settings/billing',
  '/settings/users',
  '/settings/roles',
]

const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL.startsWith("https") && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit = hasRedis
  ? new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.fixedWindow(60, "1m"), // 60 requests per minute
      analytics: true,
    })
  : {
      limit: async () => ({ success: true, limit: 60, remaining: 60, reset: Date.now() + 60000 }),
    };

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Handle public routes
  if (PUBLIC_ROUTES.some(route => req.nextUrl.pathname.startsWith(route))) {
    return res
  }

  // If no session, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Check if user has a profile and tenant
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id, is_owner')
    .eq('id', session.user.id)
    .single()

  if (!profile?.tenant_id) {
    // Redirect to tenant setup if no tenant assigned
    return NextResponse.redirect(new URL('/setup-tenant', req.url))
  }

  // Check tenant status
  const { data: tenant } = await supabase
    .from('tenants')
    .select('status, plan')
    .eq('id', profile.tenant_id)
    .single()

  if (tenant?.status === 'suspended') {
    return NextResponse.redirect(new URL('/account-suspended', req.url))
  }

  // Handle admin routes
  if (ADMIN_ROUTES.some(route => req.nextUrl.pathname.startsWith(route))) {
    const hasAccess = await isAuthorized(session.user.id, ['manage:users', 'manage:roles', 'manage:billing'])
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  // Add tenant and user info to request headers
  res.headers.set('x-tenant-id', profile.tenant_id)
  res.headers.set('x-user-role', profile.role)
  res.headers.set('x-is-owner', profile.is_owner.toString())

  // Optionally apply rate limiting (only if Redis is configured)
  if (hasRedis) {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  return res
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
