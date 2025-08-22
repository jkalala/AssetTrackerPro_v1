import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Anonymize profile
  await supabase.from('profiles').update({
    email: `deleted+${user.id}@example.com`,
    full_name: 'Deleted User',
    avatar_url: null,
    role: 'user',
    updated_at: new Date().toISOString(),
  }).eq('id', user.id);

  // Delete assets created by user
  await supabase.from('assets').delete().eq('created_by', user.id);
  // Delete asset history
  await supabase.from('asset_history').delete().eq('performed_by', user.id);
  // Delete audit logs
  await supabase.from('audit_logs').delete().eq('user_id', user.id);

  // Log the action
  await logAuditEvent({
    user_id: user.id,
    action: 'gdpr_delete',
    entity: 'user',
    entity_id: user.id,
    details: { message: 'User requested deletion/anonymization of all data.' },
    ip_address: request.headers.get('x-forwarded-for') || '',
    user_agent: request.headers.get('user-agent') || '',
  });

  return NextResponse.json({ success: true });
} 