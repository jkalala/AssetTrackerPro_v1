import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { tenantId, userId, role } = await req.json()
    
    if (!tenantId || !userId || !role) {
      return NextResponse.json(
        { error: 'Missing required tenant context fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Set tenant context in database session
    const { error: contextError } = await supabase.rpc('set_current_user_context', {
      user_id: userId,
      tenant_id: tenantId
    })

    if (contextError) {
      console.error('Error setting tenant context:', contextError)
      return NextResponse.json(
        { error: 'Failed to set tenant context' },
        { status: 500 }
      )
    }

    // Log tenant context establishment
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      action: 'tenant_context_set',
      resource_type: 'session',
      resource_id: null,
      after_state: {
        tenantId,
        userId,
        role,
        timestamp: new Date().toISOString()
      },
      user_id: userId,
      compliance_category: 'security'
    })

    return NextResponse.json({ 
      success: true,
      message: 'Tenant context set successfully',
      context: { tenantId, userId, role }
    })

  } catch (error) {
    console.error('Error in set-tenant-context:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}