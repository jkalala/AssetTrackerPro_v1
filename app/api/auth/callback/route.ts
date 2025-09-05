import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit-log'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const error = url.searchParams.get('error')
  if (error) {
    // Redirect to login with error message
    const loginUrl = `/login?error=${encodeURIComponent(error)}`
    return NextResponse.redirect(loginUrl)
  }

  // Audit log SSO login
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await logAuditEvent({
        user_id: user.id,
        action: 'sso_login',
        entity: 'user',
        entity_id: user.id,
        details: { email: user.email, provider: user.app_metadata?.provider },
        ip_address: request.headers.get('x-forwarded-for') || '',
        user_agent: request.headers.get('user-agent') || '',
      })
    }
  } catch {
    // Ignore audit log errors
  }

  // On success, redirect to dashboard
  return NextResponse.redirect('/dashboard')
}
