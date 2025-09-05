import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sessionService } from '@/lib/services/session-service'

// Helper function to extract IP address from request
function getClientIpAddress(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  // Try different headers in order of preference
  if (cfConnectingIp) return cfConnectingIp
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  if (realIp) return realIp

  return 'unknown'
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User not associated with tenant' }, { status: 400 })
    }

    // Get current request info for session identification
    const userAgent = request.headers.get('user-agent') || ''
    const currentIp = getClientIpAddress(request)

    const result = await sessionService.listActiveSessions(
      profile.tenant_id,
      user.id,
      currentIp,
      userAgent
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      sessions: result.sessions || [],
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const terminateAll = searchParams.get('terminate_all') === 'true'

    // Get user's tenant ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User not associated with tenant' }, { status: 400 })
    }

    let result

    if (terminateAll) {
      result = await sessionService.terminateAllUserSessions(
        profile.tenant_id,
        user.id,
        undefined, // Don't exclude any session
        'admin_revoke'
      )

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: `${result.terminatedCount} sessions terminated`,
        terminatedCount: result.terminatedCount,
      })
    } else if (sessionId) {
      // Get current request info for session validation
      const userAgent = request.headers.get('user-agent') || ''
      const currentIp = getClientIpAddress(request)

      // Check if session can be terminated
      const canTerminate = await sessionService.canTerminateSession(
        sessionId,
        user.id,
        profile.tenant_id,
        currentIp,
        userAgent
      )

      if (!canTerminate.canTerminate) {
        return NextResponse.json({ error: canTerminate.reason }, { status: 400 })
      }

      result = await sessionService.terminateSession(sessionId, 'admin_revoke')

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Session terminated',
      })
    } else {
      return NextResponse.json(
        { error: 'Session ID is required or use terminate_all=true' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Terminate sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
