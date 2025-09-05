import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAuthorized } from '@/lib/rbac/utils'
import { logAuditEvent } from '@/lib/audit-log'

export async function PATCH(
  request: Request,
  { params }: { params: { teamId: string; userId: string } }
) {
  const supabase = await createClient()
  const { teamId, userId } = params
  const { role } = await request.json()
  if (!teamId || !userId || !role)
    return NextResponse.json({ error: 'Missing teamId, userId, or role' }, { status: 400 })
  // Check current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Check if user is team admin
  const { data: member } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()
  if (!member || !(await isAuthorized(user.id, 'manage:users'))) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  // Update role
  const { error } = await supabase
    .from('team_members')
    .update({ role })
    .eq('team_id', teamId)
    .eq('user_id', userId)
  if (error) {
    await logAuditEvent({
      user_id: user.id,
      action: 'change_role_failed',
      entity: 'team_member',
      entity_id: userId,
      details: { error: error.message },
      tenant_id: undefined,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  await logAuditEvent({
    user_id: user.id,
    action: 'change_role',
    entity: 'team_member',
    entity_id: userId,
    details: { team_id: teamId, new_role: role },
    tenant_id: undefined,
  })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: { teamId: string; userId: string } }
) {
  const supabase = await createClient()
  const { teamId, userId } = params
  if (!teamId || !userId)
    return NextResponse.json({ error: 'Missing teamId or userId' }, { status: 400 })
  // Check current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Check if user is team admin
  const { data: member } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()
  if (!member || !(await isAuthorized(user.id, 'manage:users'))) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  // Remove member
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)
  if (error) {
    await logAuditEvent({
      user_id: user.id,
      action: 'remove_member_failed',
      entity: 'team_member',
      entity_id: userId,
      details: { error: error.message },
      tenant_id: undefined,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  await logAuditEvent({
    user_id: user.id,
    action: 'remove_member',
    entity: 'team_member',
    entity_id: userId,
    details: { team_id: teamId },
    tenant_id: undefined,
  })
  return NextResponse.json({ success: true })
}
