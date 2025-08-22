import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorized } from '@/lib/rbac/utils';
import { logAuditEvent } from '@/lib/audit-log';

export async function DELETE(request: Request, { params }: { params: { invitationId: string } }) {
  const supabase = await createClient();
  const { invitationId } = params;
  if (!invitationId) return NextResponse.json({ error: 'Missing invitationId' }, { status: 400 });
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Get invitation to find team_id
  const { data: invitation } = await supabase.from('team_invitations').select('team_id').eq('id', invitationId).single();
  if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  // Check if user is team admin
  const { data: member } = await supabase.from('team_members').select('role').eq('team_id', invitation.team_id).eq('user_id', user.id).single();
  if (!member || !(await isAuthorized(user.id, 'manage:users'))) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  // Cancel invitation
  const { error } = await supabase
    .from('team_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('status', 'pending');
  if (error) {
    await logAuditEvent({
      user_id: user.id,
      action: 'cancel_invite_failed',
      entity: 'team_invitation',
      entity_id: invitationId,
      details: { error: error.message },
      tenant_id: undefined,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAuditEvent({
    user_id: user.id,
    action: 'cancel_invite',
    entity: 'team_invitation',
    entity_id: invitationId,
    details: { team_id: invitation.team_id },
    tenant_id: undefined,
  });
  return NextResponse.json({ success: true });
} 