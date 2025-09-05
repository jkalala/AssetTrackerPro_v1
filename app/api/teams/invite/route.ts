import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { isAuthorized } from '@/lib/rbac/utils'
import { logAuditEvent } from '@/lib/audit-log'
import { sendInvitationEmail } from '@/lib/notifications'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { email, role = 'member', team_id } = await request.json()
  if (!email || !team_id) {
    return NextResponse.json({ error: 'Missing email or team_id' }, { status: 400 })
  }
  // Get the inviter (current user)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Check inviter's role in the team
  const { data: member } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', team_id)
    .eq('user_id', user.id)
    .single()
  if (!member || !(await isAuthorized(user.id, 'manage:users'))) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  // Generate a unique token
  const token = randomBytes(32).toString('hex')
  // Insert invitation
  const { error, data: invitation } = await supabase
    .from('team_invitations')
    .insert({
      team_id,
      email,
      role,
      token,
      invited_by: user.id,
      status: 'pending',
    })
    .select()
    .single()
  if (error) {
    await logAuditEvent({
      user_id: user.id,
      action: 'invite_failed',
      entity: 'team_invitation',
      entity_id: undefined,
      details: { email, team_id, error: error.message },
      tenant_id: undefined,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  // Send invitation email
  try {
    // Get team name for email
    const { data: team } = await supabase.from('teams').select('name').eq('id', team_id).single()
    const inviteLink = `${process.env.APP_URL || 'http://localhost:3000'}/accept-invite?token=${token}`
    await sendInvitationEmail({
      to: email,
      inviteLink,
      teamName: team?.name || 'your team',
      inviterName: user.email || 'A team member',
    })
  } catch (emailError: any) {
    await logAuditEvent({
      user_id: user.id,
      action: 'invite_email_failed',
      entity: 'team_invitation',
      entity_id: invitation?.id,
      details: { email, team_id, error: emailError?.message },
      tenant_id: undefined,
    })
    return NextResponse.json({ error: 'Failed to send invitation email' }, { status: 500 })
  }
  // Audit log: invitation sent
  await logAuditEvent({
    user_id: user.id,
    action: 'invite_sent',
    entity: 'team_invitation',
    entity_id: invitation.id,
    details: { email, team_id, role },
    tenant_id: undefined,
  })
  return NextResponse.json({ success: true, token })
}
