import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/rbac/utils'
import { Permission } from '@/lib/rbac/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { assetId, assigneeId, notes } = await request.json()
    // Authenticate assigner
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // RBAC permission check
    const authorized = await isAuthorized(user.id, 'update:asset' as Permission)
    if (!authorized) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    // Update asset
    const { error: updateError } = await supabase
      .from('assets')
      .update({
        assignee_id: assigneeId,
        checked_out_at: new Date().toISOString(),
        status: 'checked_out',
      })
      .eq('id', assetId)
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to assign asset: ' + updateError.message },
        { status: 500 }
      )
    }
    // Log assignment
    await supabase.from('asset_assignments').insert({
      asset_id: assetId,
      assignee_id: assigneeId,
      assigned_by: user.id,
      checked_out_at: new Date().toISOString(),
      notes: notes || null,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
