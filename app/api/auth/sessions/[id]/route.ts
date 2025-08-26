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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
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

    // Get current request info for session validation
    const userAgent = request.headers.get('user-agent') || ''
    const currentIp = getClientIpAddress(request)

    // Check if session can be terminated using the enhanced service method
    const canTerminate = await sessionService.canTerminateSession(
      sessionId,
      user.id,
      profile.tenant_id,
      currentIp,
      userAgent
    )

    if (!canTerminate.canTerminate) {
      const statusCode = canTerminate.reason === 'Session not found' ? 404 : 
                        canTerminate.reason === 'Unauthorized to terminate this session' ? 403 : 400
      return NextResponse.json({ error: canTerminate.reason }, { status: statusCode })
    }

    const result = await sessionService.terminateSession(sessionId, 'admin_revoke')

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Session terminated'
    })
  } catch (error) {
    console.error('Terminate session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}