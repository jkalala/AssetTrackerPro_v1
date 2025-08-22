import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit-log';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  // Get invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single();
  if (inviteError || !invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
  }
  // Get the accepting user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Add to team_members
  const { error: memberError } = await supabase.from('team_members').insert({
    team_id: invitation.team_id,
    user_id: user.id,
    role: invitation.role,
  });
  if (memberError) {
    await logAuditEvent({
      user_id: user.id,
      action: 'accept_invite_failed',
      entity: 'team_invitation',
      entity_id: invitation.id,
      details: { error: memberError.message },
      tenant_id: undefined,
    });
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }
  // Mark invitation as accepted
  const { error: updateError } = await supabase.from('team_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invitation.id);
  if (updateError) {
    await logAuditEvent({
      user_id: user.id,
      action: 'accept_invite_update_failed',
      entity: 'team_invitation',
      entity_id: invitation.id,
      details: { error: updateError.message },
      tenant_id: undefined,
    });
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  await logAuditEvent({
    user_id: user.id,
    action: 'accept_invite',
    entity: 'team_invitation',
    entity_id: invitation.id,
    details: { team_id: invitation.team_id },
    tenant_id: undefined,
  });
  return NextResponse.json({ success: true });
} 