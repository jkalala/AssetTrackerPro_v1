import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { assetId } = await request.json()
    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Fetch user profile for role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    // Update asset (set assignee_id to null, checked_in_at, status)
    const { error: updateError } = await supabase
      .from('assets')
      .update({
        assignee_id: null,
        checked_in_at: new Date().toISOString(),
        status: 'available',
      })
      .eq('id', assetId)
    if (updateError) {
      return NextResponse.json({ error: 'Failed to check in asset: ' + updateError.message }, { status: 500 })
    }
    // Update latest assignment record for this asset (set checked_in_at)
    const { data: assignment, error: assignmentError } = await supabase
      .from('asset_assignments')
      .select('id')
      .eq('asset_id', assetId)
      .is('checked_in_at', null)
      .order('checked_out_at', { ascending: false })
      .limit(1)
      .single()
    if (!assignmentError && assignment) {
      await supabase
        .from('asset_assignments')
        .update({ checked_in_at: new Date().toISOString() })
        .eq('id', assignment.id)
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 